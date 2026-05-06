import { useState, useRef, useEffect } from 'react';
import { FiUpload, FiDownload, FiAlertCircle, FiCheckCircle, FiX, FiFileText, FiFilter } from 'react-icons/fi';
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

interface SuspicionResult {
  isSuspicious: boolean;
  suspicions: string[];
  suspicionLevel: number;
  category: string;
}

interface ProcessedPatient extends PatientImportData {
  id: string;
  suspicionResult?: SuspicionResult;
  isSelected: boolean;
  isDuplicate?: boolean;
  duplicateInfo?: string;
}

const PatientImport = () => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoApproved, setAutoApproved] = useState<ProcessedPatient[]>([]);
  const [needsReview, setNeedsReview] = useState<ProcessedPatient[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'auto' | 'review'>('auto');
  const [existingPatients, setExistingPatients] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suspicion detection patterns
  const suspicionPatterns = {
    businessKeywords: [
      'معمل', 'صيدلية', 'مستشفى', 'عيادة', 'دكتور', 'ميديكير', 'يوتن',
      'lab', 'pharmacy', 'hospital', 'clinic', 'dr', 'doctor', 'medicare'
    ],
    serviceKeywords: [
      'كهرباء', 'سباك', 'نجار', 'كهربائي', 'سباكة', 'نجارة', 'ميكانيكي',
      'electrician', 'plumber', 'carpenter', 'mechanic', 'technician'
    ],
    relationshipKeywords: [
      'زوج', 'زوجة', 'ابن', 'ابنة', 'والد', 'والدة', 'اخ', 'اخت', 'ام', 'اب',
      'husband', 'wife', 'son', 'daughter', 'father', 'mother', 'brother', 'sister'
    ],
    rolePrefix: ['ا /', 'أ /', 'م /', 'مهندس', 'استاذ', 'mr', 'mrs', 'eng']
  };

  // Fetch existing patients for duplicate checking
  useEffect(() => {
    const fetchExistingPatients = async () => {
      try {
        const response = await patientService.getAll({ limit: 10000 });
        setExistingPatients(response.patients || []);
      } catch (error) {
        console.error('Failed to fetch existing patients:', error);
      }
    };
    fetchExistingPatients();
  }, []);

  // Normalize phone for comparison
  const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    return String(phone)
      .replace(/[\s\-\(\)\+]/g, '')
      .replace(/^20/, '')
      .replace(/^0+/, '0');
  };

  // Detect suspicion
  const detectSuspicion = (fullName: string): SuspicionResult => {
    const nameLower = fullName.toLowerCase();
    const suspicions: string[] = [];
    let suspicionLevel = 0;
    
    // Check for very short names
    if (fullName.replace(/\s/g, '').length <= 2) {
      suspicions.push('Very short name');
      suspicionLevel += 5;
    }
    
    // Check for numbers in name
    if (/\d/.test(fullName)) {
      suspicions.push('Contains numbers');
      suspicionLevel += 4;
    }
    
    // Check for business keywords
    for (const keyword of suspicionPatterns.businessKeywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        suspicions.push(`Business: "${keyword}"`);
        suspicionLevel += 3;
      }
    }
    
    // Check for service keywords
    for (const keyword of suspicionPatterns.serviceKeywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        suspicions.push(`Service: "${keyword}"`);
        suspicionLevel += 3;
      }
    }
    
    // Check for relationship keywords
    for (const keyword of suspicionPatterns.relationshipKeywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        suspicions.push(`Relationship: "${keyword}"`);
        suspicionLevel += 2;
      }
    }
    
    // Check for role prefix
    for (const prefix of suspicionPatterns.rolePrefix) {
      if (nameLower.startsWith(prefix.toLowerCase())) {
        suspicions.push(`Role prefix: "${prefix}"`);
        suspicionLevel += 2;
      }
    }
    
    // Check for very long names
    if (fullName.split(/\s+/).length > 5) {
      suspicions.push('Very long name (5+ words)');
      suspicionLevel += 1;
    }
    
    return {
      isSuspicious: suspicions.length > 0,
      suspicions,
      suspicionLevel,
      category: categorizeContact(suspicions)
    };
  };

  const categorizeContact = (suspicions: string[]): string => {
    const suspicionText = suspicions.join(' ').toLowerCase();
    
    if (suspicionText.includes('business') || suspicionText.includes('معمل') || 
        suspicionText.includes('صيدلية') || suspicionText.includes('مستشفى')) {
      return 'Business/Medical';
    }
    if (suspicionText.includes('service') || suspicionText.includes('كهرباء') || 
        suspicionText.includes('سباك')) {
      return 'Service Provider';
    }
    if (suspicionText.includes('relationship') || suspicionText.includes('زوج')) {
      return 'Relative';
    }
    if (suspicionText.includes('role prefix')) {
      return 'Professional Title';
    }
    if (suspicionText.includes('numbers')) {
      return 'Invalid Format';
    }
    if (suspicionText.includes('short')) {
      return 'Incomplete';
    }
    return 'Other';
  };

  // Check for duplicates
  const checkDuplicate = (phone: string): { isDuplicate: boolean; info?: string } => {
    const normalizedPhone = normalizePhone(phone);
    const duplicate = existingPatients.find(p => 
      normalizePhone(p.phone) === normalizedPhone
    );
    
    if (duplicate) {
      return {
        isDuplicate: true,
        info: `${duplicate.first_name} ${duplicate.last_name}`
      };
    }
    return { isDuplicate: false };
  };

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

        const phoneMap = new Map<string, ProcessedPatient>();
        const autoApprovedList: ProcessedPatient[] = [];
        const needsReviewList: ProcessedPatient[] = [];

        jsonData.forEach((row: any, index) => {
          // Check for Full Name column first
          const fullName = row['Full Name'] || row['full_name'] || row['FullName'] || row['Name'] || row['name'] || '';
          let firstName = row['First Name'] || row['first_name'] || row['FirstName'] || '';
          let lastName = row['Last Name'] || row['last_name'] || row['LastName'] || '';

          // If Full Name exists and first/last names are empty, split the full name
          if (fullName && !firstName && !lastName) {
            const nameParts = fullName.trim().split(/\s+/);
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }

          const phone = String(row['Phone'] || row['phone'] || row['Phone Number'] || '').trim();
          
          // Skip if no phone or name
          if (!phone || !firstName) return;

          // Check for duplicate phone in current upload
          const normalizedPhone = normalizePhone(phone);
          if (phoneMap.has(normalizedPhone)) return;

          const patient: ProcessedPatient = {
            id: `${index}-${Date.now()}`,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: row['Email'] || row['email'] || '',
            date_of_birth: row['Date of Birth'] || row['date_of_birth'] || row['DOB'] || '',
            gender: row['Gender'] || row['gender'] || 'Female',
            address: row['Address'] || row['address'] || '',
            isSelected: true
          };

          // Check for duplicates in existing database
          const duplicateCheck = checkDuplicate(phone);
          if (duplicateCheck.isDuplicate) {
            patient.isDuplicate = true;
            patient.duplicateInfo = duplicateCheck.info;
          }

          // Detect suspicion
          const fullNameForCheck = `${firstName} ${lastName}`.trim();
          const suspicionResult = detectSuspicion(fullNameForCheck);
          patient.suspicionResult = suspicionResult;

          phoneMap.set(normalizedPhone, patient);

          if (suspicionResult.isSuspicious || patient.isDuplicate) {
            needsReviewList.push(patient);
          } else {
            autoApprovedList.push(patient);
          }
        });

        // Sort needsReview by suspicion level (highest first)
        needsReviewList.sort((a, b) => 
          (b.suspicionResult?.suspicionLevel || 0) - (a.suspicionResult?.suspicionLevel || 0)
        );

        // Sort autoApproved alphabetically
        autoApprovedList.sort((a, b) => 
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'ar')
        );

        setAutoApproved(autoApprovedList);
        setNeedsReview(needsReviewList);
        setShowPreview(true);
        setActiveTab(autoApprovedList.length > 0 ? 'auto' : 'review');
        
        toast.success(
          `Processed: ${autoApprovedList.length} clean, ${needsReviewList.length} need review`
        );
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

  const validatePatientData = (patient: ProcessedPatient): string | null => {
    if (!patient.first_name || patient.first_name.trim() === '') {
      return 'First name is required';
    }
    if (!patient.last_name || patient.last_name.trim() === '') {
      return 'Last name is required';
    }
    if (!patient.phone || patient.phone.trim() === '') {
      return 'Phone number is required';
    }
    if (patient.isDuplicate) {
      return `Duplicate phone: Already exists (${patient.duplicateInfo})`;
    }
    return null;
  };

  const togglePatientSelection = (id: string, list: 'auto' | 'review') => {
    if (list === 'auto') {
      setAutoApproved(prev => prev.map(p => 
        p.id === id ? { ...p, isSelected: !p.isSelected } : p
      ));
    } else {
      setNeedsReview(prev => prev.map(p => 
        p.id === id ? { ...p, isSelected: !p.isSelected } : p
      ));
    }
  };

  const toggleSelectAll = (list: 'auto' | 'review', selected: boolean) => {
    if (list === 'auto') {
      setAutoApproved(prev => prev.map(p => ({ ...p, isSelected: selected })));
    } else {
      const filtered = getFilteredReviewList();
      setNeedsReview(prev => prev.map(p => 
        filtered.some(f => f.id === p.id) ? { ...p, isSelected: selected } : p
      ));
    }
  };

  const getFilteredReviewList = () => {
    if (categoryFilter === 'all') return needsReview;
    return needsReview.filter(p => p.suspicionResult?.category === categoryFilter);
  };

  const handleImport = async () => {
    const selectedPatients = [
      ...autoApproved.filter(p => p.isSelected && !p.isDuplicate),
      ...needsReview.filter(p => p.isSelected && !p.isDuplicate)
    ];

    if (selectedPatients.length === 0) {
      toast.error('No patients selected for import');
      return;
    }

    const duplicateCount = [
      ...autoApproved.filter(p => p.isSelected && p.isDuplicate),
      ...needsReview.filter(p => p.isSelected && p.isDuplicate)
    ].length;

    if (duplicateCount > 0) {
      toast.warning(`Skipping ${duplicateCount} duplicate(s)`);
    }

    setLoading(true);
    const results: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      for (let i = 0; i < selectedPatients.length; i++) {
        const patient = selectedPatients[i];
        const validationError = validatePatientData(patient);

        if (validationError) {
          results.failed++;
          results.errors.push({
            row: i + 2,
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
      setAutoApproved([]);
      setNeedsReview([]);
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
    setAutoApproved([]);
    setNeedsReview([]);
    setImportResult(null);
    setShowPreview(false);
    setCategoryFilter('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedAutoCount = autoApproved.filter(p => p.isSelected).length;
  const selectedReviewCount = needsReview.filter(p => p.isSelected).length;
  const totalSelected = selectedAutoCount + selectedReviewCount;
  const duplicateAutoCount = autoApproved.filter(p => p.isDuplicate).length;
  const duplicateReviewCount = needsReview.filter(p => p.isDuplicate).length;
  const totalDuplicates = duplicateAutoCount + duplicateReviewCount;

  const categories = ['all', ...Array.from(new Set(needsReview.map(p => p.suspicionResult?.category || 'Other')))];
  const filteredReviewList = getFilteredReviewList();

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
        {showPreview && (autoApproved.length > 0 || needsReview.length > 0) && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="text-sm text-gray-600">Clean Patients</div>
                <div className="text-2xl font-bold text-green-600">{autoApproved.length}</div>
                <div className="text-xs text-gray-500">Auto-approved</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="text-sm text-gray-600">Needs Review</div>
                <div className="text-2xl font-bold text-orange-600">{needsReview.length}</div>
                <div className="text-xs text-gray-500">Suspicious contacts</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="text-sm text-gray-600">Selected</div>
                <div className="text-2xl font-bold text-blue-600">{totalSelected}</div>
                <div className="text-xs text-gray-500">Ready to import</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="text-sm text-gray-600">Duplicates</div>
                <div className="text-2xl font-bold text-red-600">{totalDuplicates}</div>
                <div className="text-xs text-gray-500">Will be skipped</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  Review Patients ({autoApproved.length + needsReview.length} total)
                </h3>
                <button
                  onClick={resetImport}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b">
                <button
                  onClick={() => setActiveTab('auto')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'auto'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ✅ Auto-Approved ({autoApproved.length})
                </button>
                <button
                  onClick={() => setActiveTab('review')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'review'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ⚠️ Needs Review ({needsReview.length})
                </button>
              </div>

              {/* Category Filter for Review Tab */}
              {activeTab === 'review' && categories.length > 1 && (
                <div className="flex items-center gap-2 mb-4">
                  <FiFilter className="text-gray-500" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                        {cat !== 'all' && ` (${needsReview.filter(p => p.suspicionResult?.category === cat).length})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select All */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                <input
                  type="checkbox"
                  checked={activeTab === 'auto' 
                    ? autoApproved.every(p => p.isSelected)
                    : filteredReviewList.every(p => p.isSelected)
                  }
                  onChange={(e) => toggleSelectAll(activeTab, e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({activeTab === 'auto' ? selectedAutoCount : selectedReviewCount} selected)
                </span>
              </div>

              {/* Auto-Approved List */}
              {activeTab === 'auto' && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {autoApproved.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        patient.isDuplicate
                          ? 'bg-red-50 border-red-200'
                          : patient.isSelected
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={patient.isSelected}
                          onChange={() => togglePatientSelection(patient.id, 'auto')}
                          disabled={patient.isDuplicate}
                          className="mt-1 w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-600 space-x-3">
                            <span>📞 {patient.phone}</span>
                            {patient.email && <span>✉️ {patient.email}</span>}
                          </div>
                          {patient.isDuplicate && (
                            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <FiAlertCircle size={12} />
                              Duplicate: Already exists as "{patient.duplicateInfo}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Needs Review List */}
              {activeTab === 'review' && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredReviewList.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        patient.isDuplicate
                          ? 'bg-red-50 border-red-200'
                          : patient.isSelected
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={patient.isSelected}
                          onChange={() => togglePatientSelection(patient.id, 'review')}
                          disabled={patient.isDuplicate}
                          className="mt-1 w-4 h-4 text-orange-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                              {patient.suspicionResult?.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-x-3 mt-1">
                            <span>📞 {patient.phone}</span>
                            {patient.email && <span>✉️ {patient.email}</span>}
                          </div>
                          {patient.suspicionResult && patient.suspicionResult.suspicions.length > 0 && (
                            <div className="text-xs text-orange-600 mt-1 flex items-start gap-1">
                              <FiAlertCircle className="mt-0.5 flex-shrink-0" size={12} />
                              <span>{patient.suspicionResult.suspicions.join(', ')}</span>
                            </div>
                          )}
                          {patient.isDuplicate && (
                            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <FiAlertCircle size={12} />
                              Duplicate: Already exists as "{patient.duplicateInfo}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {totalSelected} patient(s) selected
                  {totalDuplicates > 0 && ` • ${totalDuplicates} duplicate(s) will be skipped`}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={resetImport}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading || totalSelected === 0}
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
                        Import {totalSelected} Selected Patient(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
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
