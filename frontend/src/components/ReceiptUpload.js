import React, { useState, useRef } from 'react';
import './ReceiptUpload.css';

const ReceiptUpload = ({ onReceiptProcessed, onClose }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const processReceipt = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('receipt', selectedFile);

      const response = await fetch('/api/receipts/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process receipt');
      }

      const result = await response.json();
      
      if (result.success && result.expense) {
        onReceiptProcessed(result.expense);
        onClose();
      } else {
        setError(result.error || 'Failed to extract expense data from receipt');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="receipt-upload-overlay">
      <div className="receipt-upload-modal">
        <div className="receipt-upload-header">
          <h3>📸 Upload Receipt</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="receipt-upload-content">
          {!selectedFile ? (
            <div
              className={`receipt-dropzone ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-content">
                <div className="upload-icon">📷</div>
                <h4>Drop your receipt here</h4>
                <p>or click to browse</p>
                <p className="file-info">Supports: JPG, PNG, PDF (max 10MB)</p>
              </div>
            </div>
          ) : (
            <div className="receipt-preview">
              <div className="preview-header">
                <h4>Receipt Preview</h4>
                <button className="change-file-btn" onClick={resetUpload}>
                  Change File
                </button>
              </div>
              
              <div className="preview-image">
                <img src={preview} alt="Receipt preview" />
              </div>

              <div className="file-info">
                <p><strong>File:</strong> {selectedFile.name}</p>
                <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="receipt-upload-actions">
            {selectedFile && (
              <button
                className="process-btn"
                onClick={processReceipt}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner"></span>
                    Processing Receipt...
                  </>
                ) : (
                  <>
                    🔍 Extract Expense Data
                  </>
                )}
              </button>
            )}
            
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ReceiptUpload;
