import os
import re
import json
import io
import time
import base64
import uvicorn
import sys

# Force UTF-8 encoding on standard output/error to prevent UnicodeEncodeError on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load localized environment variables from this directory's .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path)


# 1. Global Setup
from groq import Groq

# Get GROQ key
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("[OCR Server] WARNING: GROQ_API_KEY not found in localized .env!")

# 2. FastAPI Application Definition
app = FastAPI(title="Savings Helper OCR Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Savings Helper OCR Microservice"}

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
  "notes": "ghi chú nếu OCR bị lỗi hoặc thông tin không rõ",
  "category": "Ăn uống"
}

Lưu ý quan trọng:
- Tự sửa lỗi OCR: số tiền VN là bội số của 500, sửa "62,1000" -> 62000
- Nếu không đọc được thông tin nào thì để null
- category: chọn từ danh sách danh mục được cung cấp ở phần user prompt, khớp chính xác 100% với một chuỗi trong danh sách đó.
- Chỉ trả về JSON, không giải thích thêm
"""

@app.get("/health")
def health():
    return {"status": "healthy", "models_loaded": True, "has_api_key": bool(GROQ_API_KEY)}

@app.post("/parse-receipt")
async def parse_receipt(file: UploadFile = File(...), categories: str = Form(None)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY missing from microservice env")
        
    try:
        t_total = time.perf_counter()

        # Parse custom categories list if provided
        DEFAULT_CATEGORIES = [
            "Food & Dining", "Housing", "Transportation", "Utilities", "Entertainment", "Shopping", "Salary", "Side Hustle", "Gifts",
            "Ăn uống", "Nhà cửa", "Di chuyển", "Hóa đơn & Tiện ích", "Giải trí", "Mua sắm", "Lương", "Thu nhập phụ", "Quà tặng & Thưởng"
        ]
        category_list = DEFAULT_CATEGORIES
        if categories:
            try:
                parsed_cats = json.loads(categories)
                if isinstance(parsed_cats, list) and len(parsed_cats) > 0:
                    category_list = parsed_cats
            except Exception as e:
                print(f"[OCR Server] Failed to parse categories parameter: {e}")

        # 1. Load image from memory
        t0 = time.perf_counter()
        contents = await file.read()
        img_pil = Image.open(io.BytesIO(contents)).convert('RGB')

        # Pre-resize: phone photos can be 4000x3000px which kills CPU inference.
        # Cap the longest side at 1200px — receipt text is still fully readable.
        MAX_SIDE = 1200
        w, h = img_pil.size
        if max(w, h) > MAX_SIDE:
            scale = MAX_SIDE / max(w, h)
            img_pil = img_pil.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
            print(f"[OCR Server] Resized {w}x{h} -> {img_pil.size[0]}x{img_pil.size[1]}")

        # Prepare base64 encoded image for Groq Vision
        buffered = io.BytesIO()
        img_pil.save(buffered, format="JPEG", quality=85)
        base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
        print(f"[OCR Timer] Image load+resize+encode: {time.perf_counter()-t0:.2f}s")

        # Define dynamic prompts containing the target categories
        user_prompt_vision = (
            f"Phân tích hóa đơn này và trả về JSON cấu trúc như yêu cầu.\n"
            f"Chọn một danh mục chính xác cho hóa đơn từ danh sách danh mục sau đây (chọn danh mục phù hợp nhất dựa trên các mặt hàng và loại hóa đơn):\n"
            f"Danh sách danh mục: {json.dumps(category_list, ensure_ascii=False)}\n\n"
            f"Thêm trường 'category' ở cấp cao nhất của JSON trả về, giá trị BẮT BUỘC phải là một chuỗi khớp chính xác 100% với một phần tử trong danh sách trên. Nếu không có danh mục nào khớp hợp lý, trả về null."
        )

        # Multimodal parsing via Groq Vision (Llama 4 Scout)
        print("[OCR Server] Parsing receipt via Groq Vision (Llama 4 Scout)...")
        t_vision = time.perf_counter()
        client = Groq(api_key=GROQ_API_KEY)
        
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": FULL_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt_vision},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.1
        )
        print(f"[OCR Timer] Groq Vision call       : {time.perf_counter()-t_vision:.2f}s")
        
        raw_content = response.choices[0].message.content
        match = re.search(r'\{.*\}', raw_content, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            print("[OCR Server] -- Parsed Receipt JSON (Vision) -----------")
            print(json.dumps(parsed, ensure_ascii=False, indent=2))
            print("[OCR Server] ---------------------------------------------")
            print(f"[OCR Timer] [OK] TOTAL (Vision)     : {time.perf_counter()-t_total:.2f}s")
            return parsed
        else:
            print("[OCR Server] ERROR: Vision model response could not be parsed to JSON.")
            raise HTTPException(status_code=422, detail="Could not parse structured JSON from Vision model response.")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error during parsing: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"[OCR Server] Starting FastAPI microservice on http://0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)

