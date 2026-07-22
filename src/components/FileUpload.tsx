// src/components/FileUpload.tsx

import React, { useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  Description,
  PictureAsPdf,
  TextSnippet,
  InsertDriveFile,
} from '@mui/icons-material';
import { useToast } from '../context/ToastContext';

interface FileUploadProps {
  onFileContent: (content: string, fileName: string) => void;
  acceptedFormats?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileContent, 
  acceptedFormats = ['.txt', '.docx', '.pdf', '.md'] 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#f44336', fontSize: 40 }} />;
      case 'docx':
      case 'doc':
        return <Description sx={{ color: '#2196f3', fontSize: 40 }} />;
      case 'txt':
      case 'md':
        return <TextSnippet sx={{ color: '#4caf50', fontSize: 40 }} />;
      default:
        return <InsertDriveFile sx={{ color: '#ff9800', fontSize: 40 }} />;
    }
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const types: { [key: string]: string } = {
      'pdf': 'PDF Document',
      'docx': 'Word Document',
      'doc': 'Word Document',
      'txt': 'Text File',
      'md': 'Markdown File',
    };
    return types[ext] || 'File';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readDocxFile = async (file: File): Promise<string> => {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = result.value;
      return tempDiv.textContent || '';
    } catch (error) {
      console.error('DOCX reading error:', error);
      throw new Error('Failed to read Word document');
    }
  };

  const readPDFFile = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText.trim() || 'No text found in this PDF. It may be an image-based PDF.';
    } catch (error) {
      console.error('PDF reading error:', error);
      throw new Error('Failed to read PDF file. Make sure it contains readable text.');
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      if (ext === 'txt' || ext === 'md') {
        return await readTextFile(file);
      } else if (ext === 'docx') {
        return await readDocxFile(file);
      } else if (ext === 'pdf') {
        return await readPDFFile(file);
      } else {
        throw new Error(`Unsupported file format: ${ext}`);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showError('File size exceeds 10MB limit');
      return;
    }

    setUploading(true);
    setFileInfo({
      name: file.name,
      size: file.size,
      type: getFileType(file.name),
    });

    try {
      const content = await readFileContent(file);
      
      const structuredContent = 
`=== ${file.name} ===
File Type: ${getFileType(file.name)}
File Size: ${formatFileSize(file.size)}
${'='.repeat(60)}

${content}`;

      onFileContent(structuredContent, file.name);
      showSuccess(`File "${file.name}" loaded successfully! 📄`);
    } catch (error) {
      console.error('Error processing file:', error);
      showError(`Failed to read "${file.name}". ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (acceptedFormats.some(format => format.includes(ext || ''))) {
        handleFile(file);
      } else {
        showError(`Unsupported file format. Please use: ${acceptedFormats.join(', ')}`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          border: isDragging ? '3px dashed #1976d2' : '2px dashed #ccc',
          backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          multiple={false}
        />

        {uploading ? (
          <Box sx={{ width: '100%', px: 2 }}>
            <Typography variant="body2" gutterBottom align="center">
              Processing file...
            </Typography>
            <LinearProgress />
          </Box>
        ) : fileInfo ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', px: 2 }}>
            {getFileIcon(fileInfo.name)}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {fileInfo.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fileInfo.type} • {formatFileSize(fileInfo.size)}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              <Close />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, textAlign: 'center' }}>
            <CloudUpload sx={{ fontSize: 48, color: '#1976d2' }} />
            <Typography variant="body1" color="text.secondary">
              Drag & drop a file here, or click to browse
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supports: {acceptedFormats.join(', ')} • Max size: 10MB
            </Typography>
            <Button variant="outlined" size="small" sx={{ mt: 1 }}>
              Browse Files
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FileUpload;