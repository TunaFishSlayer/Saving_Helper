/**
 * Resolves the localized display name for a category.
 * If the category possesses a systemCode and a corresponding translation exists,
 * it returns the translated string; otherwise it falls back to category.name.
 * 
 * @param {Object} category - Category object containing name and optional systemCode
 * @param {Function} t - Translation function from useLanguage() hook
 * @returns {string} Localized category display name
 */
export function getCategoryDisplayName(category, t) {
  if (!category) return '';

  // Handle case where category is just a string name
  if (typeof category === 'string') return category;

  if (category.systemCode && typeof t === 'function') {
    const key = `categoryNames.${category.systemCode}`;
    const translated = t(key);
    if (translated && translated !== key) {
      return translated;
    }
  }

  return category.name || '';
}

export default getCategoryDisplayName;
