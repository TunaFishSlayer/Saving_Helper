import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Plus, X, FolderOpen, Edit2 } from 'lucide-react'; 
import categoryService from '../services/categoryService';
import { CATEGORY_TYPES } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryDisplayName } from '../utils/categoryUtils';
  
const Category = () => {
  const { t, locale } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSeedDefaultCategories = async () => {
    setSeeding(true);
    try {
      // Get current categories to prevent duplicates
      const currentCats = await categoryService.getCategories();
      const currentSystemCodes = new Set(currentCats.map(c => c.systemCode).filter(Boolean));
      const currentNames = new Set(currentCats.map(c => c.name.toLowerCase().trim()));

      const defaultCategories = [
        { name: "Ăn uống", systemCode: "FOOD_DINING", type: "expense", description: "Ăn uống, siêu thị, nhà hàng" },
        { name: "Siêu thị", systemCode: "GROCERIES", type: "expense", description: "Mua sắm tại siêu thị, tạp hóa" },
        { name: "Nhà ở", systemCode: "HOUSING", type: "expense", description: "Tiền thuê nhà, bảo trì, sửa chữa" },
        { name: "Di chuyển", systemCode: "TRANSPORTATION", type: "expense", description: "Xăng xe, xe ôm, phương tiện công cộng" },
        { name: "Hóa đơn & Tiện ích", systemCode: "UTILITIES", type: "expense", description: "Điện, nước, internet, điện thoại" },
        { name: "Giải trí", systemCode: "ENTERTAINMENT", type: "expense", description: "Xem phim, ca nhạc, du lịch" },
        { name: "Mua sắm", systemCode: "SHOPPING", type: "expense", description: "Quần áo, giày dép, thiết bị" },
        { name: "Sức khỏe", systemCode: "HEALTH", type: "expense", description: "Thuốc, bệnh viện, phòng khám" },
        { name: "Giáo dục", systemCode: "EDUCATION", type: "expense", description: "Học phí, sách, khóa học" },
        { name: "Chi tiêu khác", systemCode: "OTHER_EXPENSE", type: "expense", description: "Các chi tiêu chưa phân loại" },
        { name: "Lương", systemCode: "SALARY", type: "income", description: "Thu nhập chính từ công việc" },
        { name: "Làm thêm", systemCode: "SIDE_HUSTLE", type: "income", description: "Freelance, part-time, việc phụ" },
        { name: "Đầu tư", systemCode: "INVESTMENT", type: "income", description: "Cổ phiếu, tiền gửi, tiền lãi" },
        { name: "Kinh doanh", systemCode: "BUSINESS", type: "income", description: "Thu nhập từ kinh doanh cá nhân" },
        { name: "Thu nhập khác", systemCode: "OTHER_INCOME", type: "income", description: "Quà tặng, tiền thưởng, lì xì" }
      ];

      let seededCount = 0;
      for (const cat of defaultCategories) {
        const hasCode = cat.systemCode && currentSystemCodes.has(cat.systemCode);
        const hasName = currentNames.has(cat.name.toLowerCase().trim());
        if (!hasCode && !hasName) {
          await categoryService.createCategory(cat);
          seededCount++;
        }
      }
      
      if (seededCount > 0) {
        toast.success(locale === 'vi' ? `Đã khởi tạo ${seededCount} danh mục mặc định!` : `Initialized ${seededCount} default categories!`);
      } else {
        toast.success(locale === 'vi' ? 'Các danh mục mặc định đã tồn tại.' : 'Default categories already exist.');
      }
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error(locale === 'vi' ? 'Không thể khởi tạo danh mục' : 'Failed to initialize categories');
    } finally {
      setSeeding(false);
    }
  };
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);

  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(''); // '', 'income', 'expense'

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'expense', description: '' });
    setIsEditing(false);
    setCurrentCategoryId(null);
    setShowModal(false);
    setError('');
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || ''
    });
    setCurrentCategoryId(category.clientUuid);
    setIsEditing(true);
    setShowModal(true);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await categoryService.updateCategory(currentCategoryId, formData);
        toast.success('Category updated successfully!');
      } else {
        await categoryService.createCategory(formData);
        toast.success('Category created successfully!');
      }
      
      resetForm();
      fetchCategories();
    } catch (err) {
      const msg = err.message || `Failed to ${isEditing ? 'update' : 'create'} category`;
      setError(msg);
      toast.error(msg);
    }
  };

  const triggerDeleteConfirm = (id) => {
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await categoryService.deleteCategory(categoryToDelete);
      toast.success('Category deleted successfully!');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      const error = err.message || 'Failed to delete category';
      setError(error);
      toast.error(error);
    } finally {
      setDeleting(false);
    }
  };


  const filteredCategories = filter
    ? categories.filter(cat => cat.type === filter)
    : categories;

  const incomeCategories = categories.filter(cat => cat.type === CATEGORY_TYPES.INCOME);
  const expenseCategories = categories.filter(cat => cat.type === CATEGORY_TYPES.EXPENSE);

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1 className="page-title">{t('categoriesTitle')}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="button button-primary" 
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <Plus size={20} />
            {t('addCategoryBtn')}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          {t('allFilter')} ({categories.length})
        </button>
        <button
          className={`filter-tab ${filter === 'income' ? 'active' : ''}`}
          onClick={() => setFilter('income')}
        >
          {t('filterIncome')} ({incomeCategories.length})
        </button>
        <button
          className={`filter-tab ${filter === 'expense' ? 'active' : ''}`}
          onClick={() => setFilter('expense')}
        >
          {t('filterExpense')} ({expenseCategories.length})
        </button>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="categories-grid">
          {filteredCategories.map((category) => (
            <div key={category.clientUuid} className="category-card">
              <div className="category-header">

                <div className="category-icon">
                  <FolderOpen size={24} />
                </div>
                <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(category)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                    title="Edit Category"
                  >
                    <Edit2 size={20} />
                  </button>
                   <button
                    className="delete-button"
                    onClick={() => triggerDeleteConfirm(category.clientUuid)}
                    title="Delete Category"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <h3 className="category-name">{getCategoryDisplayName(category, t)}</h3>
              <span className={`category-badge category-${category.type}`}>
                {category.type === 'income' ? t('filterIncome') : t('filterExpense')}
              </span>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCategories.length === 0 && (
        <div className="empty-state">
          <FolderOpen size={64} />
          <h3>{t('noCategoriesFound')}</h3>
          <p>{t('noCategoriesDesc')}</p>
          <button 
            type="button" 
            className="button button-primary" 
            style={{ marginTop: '1.5rem' }}
            onClick={handleSeedDefaultCategories}
            disabled={seeding}
          >
            {seeding ? t('initializingBtn') : t('initDefaultCategoriesBtn')}
          </button>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? t('editCategoryModalTitle') : t('addCategoryModalTitle')}</h2>
              <button className="close-button" onClick={resetForm}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>{t('categoryNameLabel')}</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('categoryTypeLabel')}</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="expense">{t('filterExpense')}</option>
                  <option value="income">{t('filterIncome')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('categoryDescriptionLabel')}</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button button-primary">
                  {isEditing ? t('updateCategoryBtn') : t('createCategoryBtn')}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={resetForm}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('confirmDeleteTitle')}</h2>
              <button className="close-button" onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'left' }}>
              {t('confirmDeleteCategoryText')}
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}
                disabled={deleting}
              >
                {t('keepBtn')}
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? t('loading') : t('deleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;