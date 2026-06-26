// src/pages/Transaction.jsx

import { useState, useEffect, useRef } from 'react';
import { Plus, X, Filter, DollarSign, Edit2, Camera, Loader, Download, Timer } from 'lucide-react'; 
import transactionService from '../services/transactionService';
import categoryService from '../services/categoryService';
import toast from 'react-hot-toast';
import FormattedAmountInput from '../components/FormattedAmountInput';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const Transaction = () => {
  const { t } = useLanguage();
  const { currency, formatCurrency } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanElapsed, setScanElapsed] = useState(0);   // seconds elapsed during OCR
  const [lastScanTime, setLastScanTime] = useState(null); // ms for the last finished scan
  const scanTimerRef = useRef(null);
  const scanStartRef = useRef(null);   // holds Date.now() at scan start
  const [fabOpen, setFabOpen] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);

  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    startDate: '',
    endDate: ''
  });
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getTransactions(filters);
      setTransactions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleFileScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setScanElapsed(0);
    setLastScanTime(null);
    const scanStart = Date.now();
    scanStartRef.current = scanStart;
    // Tick every 100 ms for a smooth counter
    scanTimerRef.current = setInterval(() => {
      setScanElapsed(((Date.now() - scanStart) / 1000));
    }, 100);
    // Show a loading state in user toast notification
    const toastId = toast.loading(t('toastScanLoading'));
    setScanning(true);

    try {
      const response = await transactionService.scanReceipt(file, categories.map(c => c.name));
      
      // Safe mapping of either raw response or enveloped response.data
      const ocr = response.data || response;

      if (ocr) {
        toast.success(t('toastScanSuccess'), { id: toastId });
        
        // Step 1: Open standard creation modal
        setShowModal(true);
        
        // Parse OCR date — may arrive as dd/mm/yyyy (Vietnamese format)
        let parsedDate = new Date().toISOString().split('T')[0];
        if (ocr.date) {
          const ddmmyyyy = ocr.date.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (ddmmyyyy) {
            const [, d, m, y] = ddmmyyyy;
            parsedDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
          } else {
            const dt = new Date(ocr.date);
            if (!isNaN(dt)) parsedDate = dt.toISOString().split('T')[0];
          }
        }

        const ocrVnd = ocr.total_amount || ocr.amount || '';
        const displayOcrAmount = currency === 'USD' && ocrVnd ? Math.round((ocrVnd / 25400) * 100) / 100 : ocrVnd;

        // Step 2: Populate form fields
        setFormData({
          amount: displayOcrAmount.toString(),
          type: 'expense',
          description: ocr.store_name ? `AI Scan: ${ocr.store_name}` : 'AI Receipt Scan',
          date: parsedDate,
          categoryId: ''
        });

        // Step 3: bill_type → Vietnamese category keyword map
        const BILL_TYPE_MAP = {
          SUPERMARKET:   ['siêu thị', 'tạp hóa', 'supermarket', 'groceries', 'shopping', 'dining', 'food'],
          RESTAURANT:    ['ăn uống', 'restaurant', 'dining', 'food', 'cuisine'],
          CAFE:          ['ăn uống', 'cafe', 'coffee', 'beverage', 'drink', 'tea'],
          PHARMACY:      ['sức khỏe', 'pharmacy', 'medicine', 'health', 'medical', 'thuốc'],
          GAS_STATION:   ['di chuyển', 'gas', 'fuel', 'xăng', 'petrol'],
          FASHION:       ['mua sắm', 'fashion', 'clothing', 'clothes', 'shopping', 'apparel'],
          HOSPITAL:      ['sức khỏe', 'hospital', 'medical', 'clinic', 'health', 'bệnh viện'],
          EDUCATION:     ['giáo dục', 'education', 'school', 'tuition', 'học', 'course'],
          TRANSPORT:     ['di chuyển', 'transport', 'taxi', 'grab', 'travel', 'ride'],
          UTILITY:       ['hóa đơn', 'utility', 'utilities', 'electricity', 'water', 'internet', 'phone'],
          ENTERTAINMENT: ['giải trí', 'entertainment', 'movie', 'cinema', 'game', 'music'],
          HOTEL:         ['du lịch', 'hotel', 'travel', 'stay', 'homestay', 'resort'],
          ONLINE_SHOP:   ['mua sắm', 'online', 'shopping', 'shopee', 'lazada', 'tiktok'],
        };

        const billType = (ocr.bill_type || '').toUpperCase();
        const keywords = BILL_TYPE_MAP[billType] || [];
        const candidateTag = ocr.suggested_category || '';

        if (categories.length > 0) {
          let matchedCat = null;
          
          // First attempt: Exact/Case-insensitive match on the LLM selected category name
          if (ocr.category) {
            matchedCat = categories.find(cat => cat.name.toLowerCase() === ocr.category.toLowerCase());
          }
          
          // Fallback: Legacy keyword matching from bill type and tags
          if (!matchedCat) {
            matchedCat = categories.find(cat => {
              const catLower = cat.name.toLowerCase();
              if (keywords.some(kw => catLower.includes(kw))) return true;
              if (candidateTag) {
                return catLower.includes(candidateTag.toLowerCase()) ||
                       candidateTag.toLowerCase().includes(catLower);
              }
              return false;
            });
          }

          if (matchedCat) {
            setFormData(prev => ({ ...prev, categoryId: matchedCat.id }));
            toast.success(`${t('toastScanCategoryMatch')}: ${matchedCat.name}`);
          }
        }
      } else {
        throw new Error('Invalid OCR result');
      }
    } catch (err) {
      toast.error(err.message || t('toastScanError'), { id: toastId });
      console.error('React OCR Upload Error:', err);
    } finally {
      clearInterval(scanTimerRef.current);
      const elapsed = scanStartRef.current
        ? Math.round((Date.now() - scanStartRef.current) / 100) / 10
        : 0;
      setLastScanTime(elapsed);
      setScanning(false);
      e.target.value = null; // Reset input selector
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setCurrentTransactionId(null);
    setShowModal(false);
    setError('');
  };

  const handleEdit = (transaction) => {
    const displayAmount = currency === 'USD' ? Math.round((transaction.amount / 25400) * 100) / 100 : transaction.amount;
    setFormData({
      amount: displayAmount.toString(),
      type: transaction.type,
      categoryId: transaction.categoryId,
      description: transaction.description || '',
      // Ensure date is formatted for input type="date"
      date: new Date(transaction.date).toISOString().split('T')[0]
    });
    setCurrentTransactionId(transaction.clientUuid);
    setIsEditing(true);
    setShowModal(true);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const numericAmount = parseFloat(formData.amount);
      const dbAmount = currency === 'USD' ? Math.round(numericAmount * 25400) : numericAmount;
      const payload = {
        ...formData,
        amount: dbAmount
      };

      if (isEditing) {
        await transactionService.updateTransaction(currentTransactionId, payload);
        toast.success('Transaction updated successfully!');
      } else {
        await transactionService.createTransaction(payload);
        toast.success('Transaction added successfully!');
      }
      
      resetForm();
      fetchTransactions();
    } catch (err) {
      const error = err.message || `Failed to ${isEditing ? 'update' : 'create'} transaction`;
      setError(error);
      toast.error(error);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await transactionService.exportTransactions(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Transactions exported to Excel!');
    } catch (err) {
      console.warn('Backend export failed, falling back to local CSV export:', err);
      try {
        // Fallback: Generate CSV locally from IndexedDB
        const data = await transactionService.getTransactions(filters);
        const txs = data.data || [];
        
        if (txs.length === 0) {
          toast.error('No transactions to export!');
          return;
        }

        // CSV Header with BOM for correct Vietnamese character display in Excel
        const headers = ["Date", "Description", "Category", "Type", "Amount (VND)"];
        const csvRows = [headers.join(",")];

        txs.forEach(t => {
          const d = new Date(t.date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = String(d.getFullYear()).slice(-2);
          const dateStr = `${day}/${month}/${year}`;
          
          const desc = (t.description || '').replace(/"/g, '""');
          const cat = getCategoryName(t.categoryId).replace(/"/g, '""');
          const type = t.type === 'income' ? 'Income' : 'Expense';
          
          csvRows.push([
            `"${dateStr}"`,
            `"${desc}"`,
            `"${cat}"`,
            `"${type}"`,
            t.amount
          ].join(","));
        });

        const csvContent = csvRows.join("\n");
        // UTF-8 BOM prefix
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Transactions exported to CSV (Offline)!');
      } catch (fallbackErr) {
        console.error('Fallback export failed:', fallbackErr);
        toast.error('Failed to export transactions');
      }
    } finally {
      setExporting(false);
    }
  };

  const triggerDeleteConfirm = (id) => {
    setTransactionToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    setDeleting(true);
    try {
      await transactionService.deleteTransaction(transactionToDelete);
      toast.success('Transaction deleted successfully!');
      setShowDeleteModal(false);
      setTransactionToDelete(null);
      fetchTransactions();
    } catch (err) {
      const error = err.message || 'Failed to delete transaction';
      setError(error);
      toast.error(error);
    } finally {
      setDeleting(false);
    }
  };


  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.clientUuid === categoryId || cat.id === categoryId);
    return category?.name || 'Unknown';
  };


  const availableCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1 className="page-title">{t('transactionsTitle')}</h1>
        <div className="header-actions">
          <button
            className="button button-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            {t('filtersBtn')}
          </button>
          <input
            type="file"
            id="scan-receipt-file-input"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileScan}
            disabled={scanning}
          />
          <button 
            className="button" 
            style={{ 
              backgroundColor: '#8b5cf6', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: scanning ? 'not-allowed' : 'pointer',
              opacity: scanning ? 0.7 : 1
            }}
            disabled={scanning}
            onClick={() => document.getElementById('scan-receipt-file-input').click()}
          >
            {scanning ? <Loader className="animate-spin" size={20} /> : <Camera size={20} />}
            {scanning ? t('aiScanningBtn') : t('aiScanBtn')}
          </button>
          <button 
            className="button button-secondary"
            onClick={handleExport}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {exporting ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
            {exporting ? t('loading') : t('exportExcelBtn')}
          </button>
          <button 
            className="button button-primary" 
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <Plus size={20} />
            {t('addTransactionBtn')}
          </button>
        </div>
      </div>


      {/* Filters */}
      {showFilters && (
        <div className="card filters-card">
          <div className="filters-grid">
            <div className="form-group">
              <label>{t('filterTypeLabel')}</label>
              <select
                className="input"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">{t('filterAllTypes')}</option>
                <option value="income">{t('filterIncome')}</option>
                <option value="expense">{t('filterExpense')}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('filterCategory')}</label>
              <select
                className="input"
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              >
                <option value="">{t('filterAllCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat.clientUuid} value={cat.clientUuid}>
                    {cat.name}
                  </option>
                ))}

              </select>
            </div>

            <div className="form-group">
              <label>{t('filterStartDate')}</label>
              <input
                type="date"
                className="input"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>{t('filterEndDate')}</label>
              <input
                type="date"
                className="input"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table / Mobile Cards Feed */}
      <div className="card">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : transactions.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('tableDate')}</th>
                    <th>{t('tableDescription')}</th>
                    <th>{t('tableCategory')}</th>
                    <th>{t('tableType')}</th>
                    <th>{t('tableAmount')}</th>
                    <th>{t('tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.clientUuid}>
                      <td>{(() => {
                        const d = new Date(transaction.date);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = String(d.getFullYear()).slice(-2);
                        return `${day}/${month}/${year}`;
                      })()}</td>

                      <td>{transaction.description || '-'}</td>
                      <td>{getCategoryName(transaction.categoryId)}</td>
                      <td>
                        <span className={`badge badge-${transaction.type}`}>
                          {transaction.type === 'income' ? t('filterIncome') : t('filterExpense')}
                        </span>
                      </td>
                      <td className={`amount-${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="icon-button edit"
                            onClick={() => handleEdit(transaction)}
                            title="Edit Transaction"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="icon-button delete"
                            onClick={() => triggerDeleteConfirm(transaction.clientUuid)}
                            title="Delete Transaction"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-transactions-feed">
              {transactions.map((transaction) => (
                <div key={transaction.clientUuid} className="mobile-transaction-card">
                  <div className="card-top">
                    <span className="card-category">
                      {getCategoryName(transaction.categoryId)}
                    </span>
                    <span className={`card-amount amount-${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="card-middle">
                    <p className="card-desc">{transaction.description || '-'}</p>
                  </div>
                  <div className="card-bottom">
                    <span className="card-date">
                      {(() => {
                        const d = new Date(transaction.date);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = String(d.getFullYear()).slice(-2);
                        return `${day}/${month}/${year}`;
                      })()}
                    </span>
                    <div className="card-actions">
                      <button
                        className="card-action-btn edit"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="card-action-btn delete"
                        onClick={() => triggerDeleteConfirm(transaction.clientUuid)}
                      >
                        <X size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <DollarSign size={64} />
            <h3>{t('noTransactionsFound')}</h3>
            <p>{t('noTransactionsDesc')}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? t('editTransactionModalTitle') : t('addTransactionModalTitle')}</h2>
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
                <label>{t('formTypeLabel')}</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, categoryId: '' })}
                  required
                >
                  <option value="expense">{t('filterExpense')}</option>
                  <option value="income">{t('filterIncome')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('formCategoryLabel')}</label>
                <select
                  className="input"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">{t('formSelectCategory')}</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.clientUuid} value={cat.clientUuid}>
                      {cat.name}
                    </option>
                  ))}

                </select>
              </div>

              <div className="form-group">
                <label>{t('formAmountLabel')} ({currency})</label>
                <FormattedAmountInput
                  className="input"
                  value={formData.amount}
                  onChange={(val) => setFormData({ ...formData, amount: val })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('formDescriptionLabel')}</label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t('formDateLabel')}</label>
                <input
                  type="date"
                  className="input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button button-primary">
                  {isEditing ? t('updateTransactionBtn') : t('addTransactionBtn')}
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

      {/* Floating Action Button (FAB) for Mobile Viewports */}
      <div className={`fab-container ${fabOpen ? 'open' : ''}`}>
        <div className="fab-options">
          <button 
            className="fab-option-btn" 
            onClick={() => {
              setFabOpen(false);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} />
            <span>{t('addManualBtn')}</span>
          </button>
          <button 
            className="fab-option-btn" 
            disabled={scanning}
            onClick={() => {
              setFabOpen(false);
              document.getElementById('scan-receipt-file-input').click();
            }}
          >
            {scanning ? <Loader className="animate-spin" size={16} /> : <Camera size={16} />}
            <span>{scanning ? t('aiScanningBtn') : t('aiScanBtn')}</span>
          </button>
        </div>
        <button 
          className={`fab-main ${fabOpen ? 'active' : ''}`}
          onClick={() => setFabOpen(!fabOpen)}
          title="Add or Scan"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Custom Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setTransactionToDelete(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('confirmDeleteTitle')}</h2>
              <button className="close-button" onClick={() => { setShowDeleteModal(false); setTransactionToDelete(null); }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'left' }}>
              {t('confirmDeleteTransactionText')}
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => { setShowDeleteModal(false); setTransactionToDelete(null); }}
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

export default Transaction;