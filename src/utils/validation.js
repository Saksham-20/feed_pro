// src/utils/validation.js (Enhanced version)
export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim().length > 0;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateNumber = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};

export const validateInteger = (value) => {
  return Number.isInteger(Number(value));
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

export const validatePincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const validateFileSize = (file, maxSizeInMB) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const validateFileType = (file, allowedTypes) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  return allowedTypes.includes(fileExtension);
};

// Validation rules for forms
export const validationRules = {
  required: (value) => validateRequired(value) || 'This field is required',
  email: (value) => !value || validateEmail(value) || 'Please enter a valid email',
  phone: (value) => !value || validatePhone(value) || 'Please enter a valid phone number',
  number: (value) => !value || validateNumber(value) || 'Please enter a valid number',
  password: (value) => !value || validatePassword(value) || 'Password must be at least 8 characters with uppercase, lowercase, and number',
  url: (value) => !value || validateURL(value) || 'Please enter a valid URL',
  gst: (value) => !value || validateGST(value) || 'Please enter a valid GST number',
  pan: (value) => !value || validatePAN(value) || 'Please enter a valid PAN number',
  pincode: (value) => !value || validatePincode(value) || 'Please enter a valid PIN code',
};