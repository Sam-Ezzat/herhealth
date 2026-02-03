import { useState, useRef } from 'react';
import { FiUpload, FiDownload, FiAlertCircle, FiCheckCircle, FiX, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import patientService from '../../services/patient.service';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

interface PatientImportData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
}

const PatientImport = () => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PatientImportData[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('Please select a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    parseExcelFile(file);
  };

  const parseExcelFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const mappedData = jsonData.map((row: any) => {
          // Check for Full Name column first
          const fullName = row['Full Name'] || row['full_name'] || row['FullName'] || row['Name'] || row['name'] || '';
          let firstName = row['First Name'] || row['first_name'] || row['FirstName'] || '';
          let lastName = row['Last Name'] || row['last_name'] || row['LastName'] || '';

          // If Full Name exists and first/last names are empty, split the full name
          if (fullName && !firstName && !lastName) {
            const nameParts = fullName.trim().split(/\s+/); // Split by one or more spaces
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || ''; // Join remaining parts with space
          }

          return {
            first_name: firstName,
            last_name: lastName,
            phone: String(row['Phone'] || row['phone'] || row['Phone Number'] || ''),
            email: row['Email'] || row['email'] || '',
            date_of_birth: row['Date of Birth'] || row['date_of_birth'] || row['DOB'] || '',
            gender: row['Gender'] || row['gender'] || 'Female',
            address: row['Address'] || row['address'] || ''
          };
        });

        setPreviewData(mappedData);
        setShowPreview(true);
        toast.success(`Preview loaded: ${mappedData.length} patients found`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse Excel file');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const validatePatientData = (patient: PatientImportData): string | null => {
    if (!patient.first_name || patient.first_name.trim() === '') {
      return 'First name is required';
    }
    if (!patient.last_name || patient.last_name.trim() === '') {
      return 'Last name is required';
    }
    if (!patient.phone || patient.phone.trim() === '') {
      return 'Phone number is required';
    }
    return null;
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('No data to import');
      return;
    }

    setLoading(true);
    const results: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      // Import patients one by one (you can also create a bulk import endpoint)
      for (let i = 0; i < previewData.length; i++) {
        const patient = previewData[i];
        const validationError = validatePatientData(patient);

        if (validationError) {
          results.failed++;
          results.errors.push({
            row: i + 2, // +2 because Excel is 1-indexed and first row is header
            error: validationError,
            data: patient
          });
          continue;
        }

        try {
          await patientService.create({
            first_name: patient.first_name.trim(),
            last_name: patient.last_name.trim(),
            phone: patient.phone.trim(),
            email: patient.email?.trim() || undefined,
            date_of_birth: patient.date_of_birth || '2000-01-01',
            gender: patient.gender || 'Female',
            address: patient.address?.trim() || undefined
          } as any);
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: error.response?.data?.message || 'Failed to create patient',
            data: patient
          });
        }
      }

      setImportResult(results);
      
      if (results.success > 0) {
        toast.success(`Successfully imported ${results.success} patient(s)`);
      }
      if (results.failed > 0) {
        toast.error(`Failed to import ${results.failed} patient(s)`);
      }
      
      setShowPreview(false);
      setSelectedFile(null);
      setPreviewData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import patients');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Full Name': 'John Doe',
        'Phone': '1234567890',
        'Email': 'john.doe@example.com',
        'Date of Birth': '1990-01-15',
        'Gender': 'Male',
        'Address': '123 Main St, City'
      },
      {
        'Full Name': 'Jane Smith',
        'Phone': '0987654321',
        'Email': 'jane.smith@example.com',
        'Date of Birth': '1985-05-20',
        'Gender': 'Female',
        'Address': '456 Oak Ave, Town'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');
    XLSX.writeFile(wb, 'patient_import_template.xlsx');
    toast.success('Template downloaded');
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Import Patients</h1>
          <p className="text-gray-600 mt-2">Upload an Excel file to bulk import patient data</p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-blue-500 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Download the template file to see the required format</li>
                <li>• Required columns: <strong>Full Name</strong> (or First Name + Last Name) and Phone</li>
                <li>• Full Name will be split: first word → First Name, rest → Last Name</li>
                <li>• Optional columns: Email, Date of Birth, Gender, Address</li>
                <li>• Supported formats: .xlsx, .xls, .csv</li>
                <li>• Date of Birth format: YYYY-MM-DD (e.g., 1990-01-15)</li>
                <li>• Gender options: Male, Female, Other</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Download Template */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Download Template</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiDownload />
            Download Excel Template
          </button>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Upload Excel File</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex flex-col items-center"
            >
              <FiUpload className="text-gray-400 mb-3" size={48} />
              <span className="text-gray-600 mb-2">
                {selectedFile ? selectedFile.name : 'Click to select Excel file'}
              </span>
              <span className="text-sm text-gray-500">or drag and drop</span>
            </label>
          </div>

          {selectedFile && !showPreview && (
            <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FiFileText className="text-blue-600" size={24} />
                <span className="text-gray-700">{selectedFile.name}</span>
              </div>
              <button
                onClick={resetImport}
                className="text-red-600 hover:text-red-700"
              >
                <FiX size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        {showPreview && previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Preview ({previewData.length} patients)
              </h3>
              <button
                onClick={resetImport}
                className="text-gray-600 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((patient, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{patient.first_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{patient.last_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{patient.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{patient.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{patient.gender || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={resetImport}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <FiUpload />
                    Import {previewData.length} Patients
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Import Results</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
                <FiCheckCircle className="text-green-600" size={24} />
                <div>
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-sm text-gray-600">Successfully Imported</div>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg flex items-center gap-3">
                <FiX className="text-red-600" size={24} />
                <div>
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Errors</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-red-800">
                            Row {error.row}: {error.error}
                          </div>
                          {error.data && (
                            <div className="text-xs text-red-600 mt-1">
                              {error.data.first_name} {error.data.last_name} - {error.data.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientImport;
