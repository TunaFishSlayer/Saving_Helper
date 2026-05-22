import os
import re
import json
import io
import uvicorn
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load localized environment variables from this directory's .env
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path)


# 1. Global Setup & Pre-loading Models (Only runs ONCE on server boot)
print("[OCR Server] Pre-loading ML models into memory...")

from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg
from paddleocr import PaddleOCR
from groq import Groq

# Init VietOCR
viet_cfg = Cfg.load_config_from_name('vgg_transformer')
viet_cfg['cnn']['pretrained'] = True
viet_cfg['device'] = 'cpu'  # 'cuda:0' if using GPU
viet_cfg['predictor']['beamsearch'] = False
viet_ocr = Predictor(viet_cfg)

# Init PaddleOCR (With MKLDNN disabled to bypass CPU instruction bugs)
paddle_ocr = PaddleOCR(use_textline_orientation=True, lang='vi', enable_mkldnn=False)

# Get GROQ key
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("[OCR Server] WARNING: GROQ_API_KEY not found in localized .env!")

print("[OCR Server] Pre-loading complete! Models are ready.")

# 2. FastAPI Application Definition
app = FastAPI(title="Savings Helper OCR Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FULL_SYSTEM_PROMPT = """Bạn là AI phân tích hóa đơn chi tiêu cá nhân Việt Nam.

BƯỚC 1 - Nhận diện loại hóa đơn:
- SUPERMARKET: siêu thị, minimart, tạp hóa, cửa hàng tiện lợi (Circle K, GS25, 7-Eleven, Co.op, Vinmart, Bách Hóa Xanh)
- RESTAURANT: nhà hàng, quán ăn, buffet, lẩu, BBQ
- CAFE: cafe, trà sữa, nước ép, sinh tố
- PHARMACY: nhà thuốc, pharmacy (Long Châu, Pharmacity, An Khang)
- GAS_STATION: cây xăng (Petrolimex, Shell, Caltex)
- FASHION: quần áo, giày dép, phụ kiện
- HOSPITAL: bệnh viện, phòng khám, nha khoa
- EDUCATION: học phí, sách, khóa học
- TRANSPORT: grab, taxi, xe ôm, gửi xe, vé xe
- UTILITY: hóa đơn điện, nước, internet, điện thoại
- ENTERTAINMENT: rạp phim, karaoke, game, sự kiện
- HOTEL: khách sạn, homestay, nhà nghỉ
- ONLINE_SHOP: Shopee, Lazada, TikTok Shop
- OTHER: không xác định được

BƯỚC 2 - Phân loại chi tiêu chi tiết theo loại hóa đơn:

Nếu SUPERMARKET → phân loại từng sản phẩm:
  - Thực phẩm tươi sống, Thực phẩm khô/đóng gói, Đồ uống
  - Gia vị/nước chấm, Bánh kẹo/snack
  - Vệ sinh cá nhân, Vệ sinh nhà cửa, Đồ dùng nhà bếp
  - Sức khỏe, Trẻ em, Thú cưng, Văn phòng phẩm, Khác

Nếu RESTAURANT/CAFE → phân loại món:
  - Món chính, Món phụ/khai vị, Đồ uống, Tráng miệng, Phí dịch vụ

Nếu PHARMACY → phân loại thuốc:
  - Thuốc kê đơn, Thuốc OTC, Vitamin/TPCN, Vật tư y tế, Mỹ phẩm dược

Nếu TRANSPORT → phân loại:
  - Xe công nghệ (Grab/Be), Taxi, Xe máy/ô tô (xăng/gửi xe), Phương tiện công cộng

Nếu UTILITY → phân loại:
  - Điện, Nước, Internet/Truyền hình, Di động

Các loại khác → liệt kê items và phân loại hợp lý

BƯỚC 3 - Trả về JSON chuẩn:
{
  "bill_type": "SUPERMARKET",
  "bill_type_display": "Siêu thị/Tạp hóa",
  "store_name": "MINIMART ANAN",
  "address": "nếu có",
  "date": "dd/mm/yyyy",
  "time": "hh:mm nếu có",
  "total_amount": 62000,
  "items": [
    {
      "name": "Tương ớt Chinsu 500g",
      "qty": 1,
      "unit_price": 20000,
      "total": 20000,
      "category": "Gia vị/nước chấm"
    }
  ],
  "spending_summary": {
    "Gia vị/nước chấm": 32000,
    "Bánh kẹo/snack": 16000,
    "Thực phẩm khô/đóng gói": 14000
  },
  "notes": "ghi chú nếu OCR bị lỗi hoặc thông tin không rõ"
}

Lưu ý quan trọng:
- Tự sửa lỗi OCR: số tiền VN là bội số của 500, sửa "62,1000" → 62000
- Nếu không đọc được thông tin nào thì để null
- Chỉ trả về JSON, không giải thích thêm
"""

@app.get("/health")
def health():
    return {"status": "healthy", "models_loaded": True, "has_api_key": bool(GROQ_API_KEY)}

@app.post("/parse-receipt")
async def parse_receipt(file: UploadFile = File(...)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY missing from microservice env")
        
    try:
        # 1. Load image from memory
        contents = await file.read()
        img_pil = Image.open(io.BytesIO(contents)).convert('RGB')
        img_np = np.array(img_pil)

        # 2. Run detection
        print("[OCR Server] Running PaddleOCR detection...")
        
        try:
            # Use standard OCR invocation
            results = paddle_ocr.ocr(img_np, cls=True)
        except Exception as ocr_err:
            print(f"[OCR Server] Normal OCR API failed, attempting predict fallback: {ocr_err}")
            temp_name = f"temp_ocr_{os.getpid()}.jpg"
            img_pil.save(temp_name)
            try:
                results = paddle_ocr.predict(temp_name)
            finally:
                if os.path.exists(temp_name):
                    os.remove(temp_name)
        
        # 3. Aggregate text using VietOCR cropping pipeline
        print("[OCR Server] Cropping and running VietOCR recognition...")
        ocr_lines = []
        
        if isinstance(results, list) and len(results) > 0:
             data_block = results[0] if isinstance(results[0], list) else results
             
             for item in data_block:
                 # Standard format: [box, (text, conf)]
                 if isinstance(item, list) and len(item) == 2 and isinstance(item[0], list) and len(item[0]) == 4:
                     box = item[0]
                     x_coords = [pt[0] for pt in box]
                     y_coords = [pt[1] for pt in box]
                     x1, x2 = int(min(x_coords)), int(max(x_coords))
                     y1, y2 = int(min(y_coords)), int(max(y_coords))
                     
                     pad = 4
                     x1 = max(0, x1 - pad)
                     y1 = max(0, y1 - pad)
                     x2 = min(img_np.shape[1], x2 + pad)
                     y2 = min(img_np.shape[0], y2 + pad)
                     
                     crop = img_pil.crop((x1, y1, x2, y2))
                     text = viet_ocr.predict(crop)
                     ocr_lines.append(text)
                 
                 # Dict format fallback
                 elif isinstance(item, dict):
                     polys = item.get('rec_polys', [])
                     if not polys and 'rec_texts' in item:
                         ocr_lines.extend(item['rec_texts'])
                         continue
                     for poly in polys:
                         x_coords = poly[:, 0]
                         y_coords = poly[:, 1]
                         x1, x2 = int(x_coords.min()), int(x_coords.max())
                         y1, y2 = int(y_coords.min()), int(y_coords.max())
                         
                         pad = 4
                         x1 = max(0, x1 - pad)
                         y1 = max(0, y1 - pad)
                         x2 = min(img_np.shape[1], x2 + pad)
                         y2 = min(img_np.shape[0], y2 + pad)
                         
                         crop = img_pil.crop((x1, y1, x2, y2))
                         text = viet_ocr.predict(crop)
                         ocr_lines.append(text)
                         
        if not ocr_lines:
             print("[OCR Server] Warning: VietOCR yielded empty lines. Falling back to raw PaddleOCR text.")
             if isinstance(results, list) and len(results) > 0:
                 data_block = results[0] if isinstance(results[0], list) else results
                 for item in data_block:
                     if isinstance(item, list) and len(item) == 2 and isinstance(item[1], tuple):
                         ocr_lines.append(item[1][0])

        ocr_text = "\n".join(ocr_lines)
        
        if not ocr_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract any legible text from this receipt.")

        print(f"[OCR Server] Invoking Groq with extracted text...")
        
        # 4. Contact Groq
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": FULL_SYSTEM_PROMPT},
                {"role": "user", "content": f"Phân tích hóa đơn này:\n\n{ocr_text}"}
            ],
            temperature=0.1
        )
        
        raw_content = response.choices[0].message.content
        match = re.search(r'\{.*\}', raw_content, re.DOTALL)
        if match:
             return json.loads(match.group())
        else:
             return {"error": "Could not parse structured JSON from model response", "raw": raw_content}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error during parsing: {str(e)}")

if __name__ == "__main__":
    print("[OCR Server] Starting FastAPI microservice on http://0.0.0.0:8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
