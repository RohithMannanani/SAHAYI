import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { registerShgUnit, fetchWardsList } from '../../../services/api';
import './RegisterUnit.css';

// ── Icon helper ──────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 'currentColor', fill = 'none', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function RegisterUnitWizard({
  isRecordModalOpen,
  setIsRecordModalOpen,
  activeNav,
  setActiveNav,
  onRegisterSuccess
}) {
  // Modal & Success state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [registeredPdfBlob, setRegisteredPdfBlob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard state
  const [registrationType, setRegistrationType] = useState('new'); // 'new' or 'existing'
  const [currentStep, setCurrentStep] = useState(1);
  const [unitForm, setUnitForm] = useState({
    name: '',
    ward: '',
    formationDate: '',
    contact: '',
    notes: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    accountBalance: '0'
  });
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    phone: '',
    houseName: '',
    role: 'Member'
  });
  const [wardsList, setWardsList] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Excel / CSV Bulk Import State
  const [importedMembers, setImportedMembers] = useState([]);
  const [currentImportIndex, setCurrentImportIndex] = useState(-1);
  const [touchedFields, setTouchedFields] = useState({});
  const [liveErrors, setLiveErrors] = useState({});
  const [showLiveErrors, setShowLiveErrors] = useState(false);

  // Step 1 validation states
  const [step1Touched, setStep1Touched] = useState({});
  const [step1Errors, setStep1Errors] = useState({});
  const [showStep1Errors, setShowStep1Errors] = useState(false);

  // Live validation logic for member input fields
  const getLiveErrors = (fields) => {
    const errs = {};
    if (!fields.name || !fields.name.trim()) {
      errs.memberName = "Member Name is required";
    }

    if (!fields.age) {
      errs.memberAge = "Age is required";
    } else {
      const ageNum = parseInt(fields.age, 10);
      if (isNaN(ageNum) || ageNum < 18) {
        errs.memberAge = "Must be 18 or older";
      }
    }

    if (!fields.phone || !fields.phone.trim()) {
      errs.memberPhone = "Phone is required";
    } else if (!/^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(fields.phone.trim())) {
      errs.memberPhone = "Invalid phone number";
    } else {
      // Extract pure 10 digits
      const digits = fields.phone.trim().replace(/\D/g, "").slice(-10);

      // Check if any digit appears 8 or more times (e.g. 9999999997, 9888888888)
      const isFake = [...new Set(digits)].some(d => digits.split(d).length - 1 >= 8);

      if (isFake) {
        errs.memberPhone = "Please enter a valid phone number";
      }
    }

    if (!fields.houseName || !fields.houseName.trim()) {
      errs.memberHouseName = "House Name is required";
    }

    return errs;
  };

  useEffect(() => {
    setLiveErrors(getLiveErrors(newMember));
  }, [newMember]);

  const shouldShowError = (fieldName) => {
    if (importedMembers.length > 0 && currentImportIndex >= 0) return true;
    return touchedFields[fieldName] || showLiveErrors;
  };

  const handleMemberFieldChange = (field, value) => {
    setNewMember(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const getStep1Errors = (form) => {
    const errs = {};
    const nameTrimmed = form.name ? form.name.trim() : "";

    if (!nameTrimmed) {
      errs.name = "Unit Name is required";
    } else if (nameTrimmed.length < 6 || nameTrimmed.length > 50) {
      errs.name = "Unit Name must be between 3 and 50 characters";
    } else if (/\s{2,}/.test(form.name)) {
      errs.name = "Multiple consecutive spaces are not allowed";
    } else if (/([A-Za-z0-9])\1{2,}/.test(nameTrimmed)) {
      // ❌ Blocks 3+ identical consecutive characters (e.g., "aaa", "111")
      errs.name = "Repeating identical characters are not allowed";
    } else if (/^([A-Za-z0-9]{2,4})\1+$/.test(nameTrimmed)) {
      // ❌ Blocks exact repetitive loops (e.g., "abab", "abcabc", "xyzxyz")
      errs.name = "Repeating letter patterns are not allowed";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9\s.\-()]*$/.test(nameTrimmed)) {
      errs.name = "Unit Name can only contain letters, numbers, spaces, dots, hyphens, and brackets";
    }

    if (!form.ward) {
      errs.ward = "Ward / Location is required";
    }

    if (!form.formationDate) {
      errs.formationDate = "Formation Date is required";
    } else {
      const selectedDate = new Date(form.formationDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errs.formationDate = "Formation Date cannot be in the future";
      }
    }

    if (!form.contact || !form.contact.trim()) {
      errs.contact = "Primary Contact Number is required";
    } else if (!/^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(form.contact.trim())) {
      errs.contact = "Invalid phone number format";
    } else {
      const digits = form.contact.trim().replace(/\D/g, "").slice(-10);
      const isFake = [...new Set(digits)].some(d => digits.split(d).length - 1 >= 8);
      if (isFake) {
        errs.contact = "Please enter a valid phone number";
      }
    }

    if (!form.accountNumber || !form.accountNumber.trim()) {
      errs.accountNumber = "Account Number is required";
    } else if (!/^\d{9,18}$/.test(form.accountNumber.trim())) {
      errs.accountNumber = "Invalid Account Number (must be 9 to 18 digits)";
    }

    if (!form.bankName || !form.bankName.trim()) {
      errs.bankName = "Bank Name is required";
    } else if (form.bankName.trim().length < 2) {
      errs.bankName = "Bank Name must be at least 2 characters";
    }

    if (!form.ifscCode || !form.ifscCode.trim()) {
      errs.ifscCode = "IFSC Code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.trim().toUpperCase())) {
      errs.ifscCode = "Invalid IFSC Code format (e.g. SBIN0001234)";
    }

    if (form.accountBalance === undefined || form.accountBalance === null || String(form.accountBalance).trim() === '') {
      errs.accountBalance = "Account Balance is required";
    } else if (isNaN(parseFloat(form.accountBalance)) || parseFloat(form.accountBalance) < 0) {
      errs.accountBalance = "Account Balance must be a valid non-negative number";
    }

    return errs;
  };

  useEffect(() => {
    setStep1Errors(getStep1Errors(unitForm));
  }, [unitForm]);

  const shouldShowStep1Error = (fieldName) => {
    return step1Touched[fieldName] || showStep1Errors;
  };

  const handleStep1FieldChange = (field, value) => {
    setUnitForm(prev => ({ ...prev, [field]: value }));
    setStep1Touched(prev => ({ ...prev, [field]: true }));
  };

  const handleStep1Blur = (field) => {
    setStep1Touched(prev => ({ ...prev, [field]: true }));
  };

  // Download Sample CSV template
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Name,Age,Phone,House Name,Role\n"
      + "Jane Doe,34,9876543210,Hillview House,Member\n"
      + "Mary Smith,45,9876543211,Green Villa,President\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sahayi_members_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse Excel / CSV File
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rows.length === 0) {
          alert("The uploaded file is empty.");
          return;
        }

        // Map column headers case-insensitively
        const parsed = rows.map(row => {
          const findVal = (patterns) => {
            const matchedKey = Object.keys(row).find(key =>
              patterns.some(p => key.toLowerCase().replace(/[\s_-]/g, '').includes(p.toLowerCase().replace(/[\s_-]/g, '')))
            );
            return matchedKey ? String(row[matchedKey]).trim() : "";
          };

          const name = findVal(["name", "fullname", "membername"]);
          const age = findVal(["age"]);
          const phone = findVal(["phone", "phonenumber", "mobile", "contact"]);
          const houseName = findVal(["house", "housename", "home", "address"]);
          let role = findVal(["role", "designation"]);

          // Standardize role value
          const roleLower = role.toLowerCase();
          if (roleLower.includes("president")) role = "President";
          else if (roleLower.includes("secretary")) role = "Secretary";
          else if (roleLower.includes("treasurer")) role = "Treasurer";
          else role = "Member";

          return { name, age, phone, houseName, role };
        });

        // Filter out completely empty parsed rows
        const validRows = parsed.filter(m => m.name || m.age || m.phone || m.houseName);

        if (validRows.length === 0) {
          alert("Could not parse any member details. Please make sure the column headers are correct (Name, Age, Phone, House Name, Role).");
          return;
        }

        setImportedMembers(validRows);
        setCurrentImportIndex(0);
        setNewMember(validRows[0]);
        setTouchedFields({});
        setShowLiveErrors(true); // highlight any errors in imported rows immediately

        // Clear input value so same file can be uploaded again if needed
        e.target.value = null;
      } catch (err) {
        console.error("Error parsing Excel/CSV file:", err);
        alert("Failed to parse file. Please upload a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSkipImportedMember = () => {
    if (importedMembers.length > 0 && currentImportIndex >= 0) {
      const nextIndex = currentImportIndex + 1;
      if (nextIndex < importedMembers.length) {
        setCurrentImportIndex(nextIndex);
        setNewMember(importedMembers[nextIndex]);
        setTouchedFields({});
        setShowLiveErrors(true);
      } else {
        setImportedMembers([]);
        setCurrentImportIndex(-1);
        setNewMember({
          name: '',
          age: '',
          phone: '',
          houseName: '',
          role: 'Member'
        });
        setTouchedFields({});
        setShowLiveErrors(false);
        alert("All members from the imported file have been processed.");
      }
    }
  };

  const handleCancelImport = () => {
    setImportedMembers([]);
    setCurrentImportIndex(-1);
    setNewMember({
      name: '',
      age: '',
      phone: '',
      houseName: '',
      role: 'Member'
    });
    setTouchedFields({});
    setShowLiveErrors(false);
  };

  // Reset current step when switching away from wizard
  useEffect(() => {
    if (activeNav !== 'register-unit') {
      setCurrentStep(1);
    }
  }, [activeNav]);

  // Restore draft and fetch DB Wards list on mount
  useEffect(() => {
    const loadWards = async () => {
      try {
        const response = await fetchWardsList();
        setWardsList(response.data);
      } catch (err) {
        console.error("Failed to load database wards:", err);
      }
    };
    loadWards();

    const draft = localStorage.getItem('cds_shg_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.unitForm) setUnitForm(parsed.unitForm);
        if (parsed.members) setMembers(parsed.members);
        if (parsed.registrationType) setRegistrationType(parsed.registrationType);
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  const handleSaveDraft = () => {
    localStorage.setItem('cds_shg_draft', JSON.stringify({ unitForm, members, registrationType }));
    alert("Draft saved successfully to local storage!");
  };

  const validateStep1 = () => {
    const errors = getStep1Errors(unitForm);
    setStep1Errors(errors);
    if (Object.keys(errors).length > 0) {
      setStep1Touched({
        name: true,
        ward: true,
        formationDate: true,
        contact: true,
        accountNumber: true,
        bankName: true,
        ifscCode: true,
        accountBalance: true
      });
      setShowStep1Errors(true);
      return false;
    }
    return true;
  };

  const handleAddMember = () => {
    const errors = getLiveErrors(newMember);
    if (Object.keys(errors).length > 0) {
      setTouchedFields({
        name: true,
        age: true,
        phone: true,
        houseName: true
      });
      setShowLiveErrors(true);
      return;
    }

    // Clear step 2 validation errors since a valid member is being added
    setFormErrors(prev => {
      const copy = { ...prev };
      delete copy.step2;
      delete copy.step2Roles;
      return copy;
    });

    const newM = {
      id: Date.now().toString(),
      name: newMember.name.trim(),
      age: parseInt(newMember.age, 10),
      phone: newMember.phone.trim(),
      houseName: newMember.houseName.trim(),
      role: newMember.role
    };

    setMembers([...members, newM]);
    setTouchedFields({});
    setShowLiveErrors(false);

    // If importing, check if we have more members to load
    if (importedMembers.length > 0 && currentImportIndex >= 0) {
      const nextIndex = currentImportIndex + 1;
      if (nextIndex < importedMembers.length) {
        setCurrentImportIndex(nextIndex);
        setNewMember(importedMembers[nextIndex]);
        // Keep showLiveErrors enabled so they see errors immediately if the next row has invalid data
        setShowLiveErrors(true);
      } else {
        // Complete import batch
        setImportedMembers([]);
        setCurrentImportIndex(-1);
        setNewMember({
          name: '',
          age: '',
          phone: '',
          houseName: '',
          role: 'Member'
        });
        alert("All members from the imported file have been processed!");
      }
    } else {
      setNewMember({
        name: '',
        age: '',
        phone: '',
        houseName: '',
        role: 'Member'
      });
    }
  };

  const handleRemoveMember = (id) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const validateStep2 = () => {
    const errs = {};
    if (members.length < 10) {
      errs.step2 = `A minimum of 10 members are required (currently ${members.length}).`;
    } else if (members.length > 20) {
      errs.step2 = `A maximum of 20 members are allowed (currently ${members.length}).`;
    }

    const hasPresident = members.some(m => m.role === 'President');
    const hasSecretary = members.some(m => m.role === 'Secretary');
    const hasTreasurer = members.some(m => m.role === 'Treasurer');

    const missingRoles = [];
    if (!hasPresident) missingRoles.push('President');
    if (!hasSecretary) missingRoles.push('Secretary');
    if (!hasTreasurer) missingRoles.push('Treasurer');

    if (missingRoles.length > 0) {
      errs.step2Roles = `Please designate a ${missingRoles.join(', ')} before proceeding.`;
    }

    setFormErrors(prev => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const handleRegisterSubmit = async () => {
    setIsSubmitting(true);
    setFormErrors({});

    const roleIdMap = {
      'President': 2,
      'Secretary': 3,
      'Treasurer': 4,
      'Member': 5
    };

    const registrationData = {
      unitName: unitForm.name,
      wardId: parseInt(unitForm.ward, 10),
      accountNumber: unitForm.accountNumber,
      bankName: unitForm.bankName,
      ifscCode: unitForm.ifscCode,
      accountBalance: parseFloat(unitForm.accountBalance) || 0,
      defaultPassword: 'Sahayi@123',
      members: members.map(m => ({
        fullName: m.name,
        phoneNumber: m.phone,
        houseName: m.houseName,
        roleId: roleIdMap[m.role] || 5
      }))
    };

    const selectedWardObj = wardsList.find(w => w.wardId === parseInt(unitForm.ward, 10));
    const wardDisplay = selectedWardObj ? `Ward ${selectedWardObj.wardNumber}, ${selectedWardObj.wardName}` : `Ward ${unitForm.ward}`;

    const balanceNum = parseFloat(unitForm.accountBalance) || 0;
    const savingsInLakhs = (balanceNum / 100000).toFixed(2);

    const newUnit = {
      id: `AK-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      initials: unitForm.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'UN',
      cls: ['sv', 'nj', 'pk', 'rm'][Math.floor(Math.random() * 4)],
      name: unitForm.name,
      ward: wardDisplay,
      bankName: unitForm.bankName,
      accountNumber: unitForm.accountNumber,
      ifscCode: unitForm.ifscCode,
      accountBalance: balanceNum,
      formationDate: unitForm.formationDate,
      contact: unitForm.contact,
      notes: unitForm.notes,
      members: members.length,
      membersList: members,
      status: 'Active',
      lastAudit: registrationType === 'existing' ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'New Registration',
      savings: parseFloat(savingsInLakhs)
    };

    try {
      const response = await registerShgUnit(registrationData);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setRegisteredPdfBlob(blob);
      setIsSuccessModalOpen(true);
      if (onRegisterSuccess) onRegisterSuccess(newUnit);
      localStorage.removeItem('cds_shg_draft'); // Clean up draft
    } catch (err) {
      console.warn("Backend API unavailable or error occurred, using local fallback:", err);
      // Fallback
      setIsSuccessModalOpen(true);
      if (onRegisterSuccess) onRegisterSuccess(newUnit);
      localStorage.removeItem('cds_shg_draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadReceipt = () => {
    const selectedWardObj = wardsList.find(w => w.wardId === parseInt(unitForm.ward, 10));
    const wardDisplay = selectedWardObj ? `Ward ${selectedWardObj.wardNumber} - ${selectedWardObj.wardName}` : `Ward ${unitForm.ward}`;

    if (registeredPdfBlob) {
      const url = window.URL.createObjectURL(registeredPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${unitForm.name.replace(/\s+/g, '_')}_receipt.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Offline fallback text file receipt
      const content = `AYALKOOTTAM REGISTRATION RECEIPT\n` +
        `================================\n\n` +
        `Registration Type: ${registrationType === 'existing' ? 'Existing Unit' : 'New Unit'}\n` +
        `Unit Name: ${unitForm.name}\n` +
        `Ward/Location: ${wardDisplay}\n` +
        `Formation Date: ${unitForm.formationDate}\n` +
        `Primary Contact: ${unitForm.contact}\n` +
        `Total Members: ${members.length}\n` +
        `Status: Active\n\n` +
        `Bank Details:\n` +
        `--------------\n` +
        `Bank Name: ${unitForm.bankName}\n` +
        `Account Number: ${unitForm.accountNumber}\n` +
        `IFSC Code: ${unitForm.ifscCode}\n` +
        `Account Balance: ₹${parseFloat(unitForm.accountBalance || 0).toLocaleString('en-IN')}\n\n` +
        `Members List:\n` +
        `--------------\n` +
        members.map((m, idx) => `${idx + 1}. ${m.name} (${m.role}, Age: ${m.age}, Phone: ${m.phone}, House: ${m.houseName})`).join('\n') +
        `\n\nGenerated on: ${new Date().toLocaleString()}\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${unitForm.name.replace(/\s+/g, '_')}_receipt.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ── WIZARD RENDER ──
  const renderWizard = () => {
    return (
      <div className="cds-wizard-container">
        {/* Step Tracker */}
        <div className="cds-wizard-steps">
          <div className={`cds-wizard-step ${currentStep >= 1 ? 'active' : ''} ${currentStep === 1 ? 'current' : ''}`}>
            <div className="cds-wizard-step__circle">1</div>
            <div className="cds-wizard-step__label">Unit Info</div>
          </div>
          <div className={`cds-wizard-step__line ${currentStep >= 2 ? 'active' : ''}`} />
          <div className={`cds-wizard-step ${currentStep >= 2 ? 'active' : ''} ${currentStep === 2 ? 'current' : ''}`}>
            <div className="cds-wizard-step__circle">2</div>
            <div className="cds-wizard-step__label">Member Details</div>
          </div>
          <div className={`cds-wizard-step__line ${currentStep >= 3 ? 'active' : ''}`} />
          <div className={`cds-wizard-step ${currentStep >= 3 ? 'active' : ''} ${currentStep === 3 ? 'current' : ''}`}>
            <div className="cds-wizard-step__circle">3</div>
            <div className="cds-wizard-step__label">Review</div>
          </div>
        </div>

        {/* Wizard Main Layout */}
        <div className="cds-wizard-layout">
          {/* Left Column (Forms) */}
          <div className="cds-wizard-main">
            {currentStep === 1 && (
              <>
                <div className="cds-wizard-card">
                  <div className="cds-wizard-card__header">
                    <Icon d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3A2.5 2.5 0 0 1 6.5 0.5H20v16.5H6.5a2.5 2.5 0 0 0-2.5 2.5z" size={18} stroke="#1e4731" />
                    <h2>Unit Information</h2>
                  </div>
                  <div className="cds-wizard-card__body">
                    <div className="cds-form-grid">
                      <div className="cds-form-group">
                        <label>Unit Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Green Valley Unit"
                          value={unitForm.name}
                          onChange={e => handleStep1FieldChange('name', e.target.value)}
                          onBlur={() => handleStep1Blur('name')}
                          className={shouldShowStep1Error('name') && step1Errors.name ? 'error' : ''}
                        />
                        {shouldShowStep1Error('name') && step1Errors.name && <span className="cds-input-error">{step1Errors.name}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>Ward / Location</label>
                        <select
                          value={unitForm.ward}
                          onChange={e => handleStep1FieldChange('ward', e.target.value)}
                          onBlur={() => handleStep1Blur('ward')}
                          className={shouldShowStep1Error('ward') && step1Errors.ward ? 'error' : ''}
                        >
                          <option value="">Select Ward</option>
                          {wardsList.map(w => (
                            <option key={w.wardId} value={w.wardId}>Ward {w.wardNumber} - {w.wardName}</option>
                          ))}
                        </select>
                        {shouldShowStep1Error('ward') && step1Errors.ward && <span className="cds-input-error">{step1Errors.ward}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>Formation Date</label>
                        <input
                          type="date"
                          value={unitForm.formationDate}
                          onChange={e => handleStep1FieldChange('formationDate', e.target.value)}
                          onBlur={() => handleStep1Blur('formationDate')}
                          className={shouldShowStep1Error('formationDate') && step1Errors.formationDate ? 'error' : ''}
                        />
                        {shouldShowStep1Error('formationDate') && step1Errors.formationDate && <span className="cds-input-error">{step1Errors.formationDate}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>Primary Contact Number</label>
                        <input
                          type="text"
                          placeholder="+91 00000 00000"
                          value={unitForm.contact}
                          onChange={e => handleStep1FieldChange('contact', e.target.value)}
                          onBlur={() => handleStep1Blur('contact')}
                          className={shouldShowStep1Error('contact') && step1Errors.contact ? 'error' : ''}
                        />
                        {shouldShowStep1Error('contact') && step1Errors.contact && <span className="cds-input-error">{step1Errors.contact}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cds-wizard-card">
                  <div className="cds-wizard-card__header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e4731" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="cds-bank-header-icon">
                      <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <h2>Bank Details</h2>
                  </div>
                  <div className="cds-wizard-card__body">
                    <div className="cds-form-grid">
                      <div className="cds-form-group">
                        <label>Account Number</label>
                        <input
                          type="text"
                          placeholder="e.g., 123456789012"
                          value={unitForm.accountNumber}
                          onChange={e => handleStep1FieldChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                          onBlur={() => handleStep1Blur('accountNumber')}
                          className={shouldShowStep1Error('accountNumber') && step1Errors.accountNumber ? 'error' : ''}
                        />
                        {shouldShowStep1Error('accountNumber') && step1Errors.accountNumber && <span className="cds-input-error">{step1Errors.accountNumber}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g., State Bank of India"
                          value={unitForm.bankName}
                          onChange={e => handleStep1FieldChange('bankName', e.target.value)}
                          onBlur={() => handleStep1Blur('bankName')}
                          className={shouldShowStep1Error('bankName') && step1Errors.bankName ? 'error' : ''}
                        />
                        {shouldShowStep1Error('bankName') && step1Errors.bankName && <span className="cds-input-error">{step1Errors.bankName}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>IFSC Code</label>
                        <input
                          type="text"
                          placeholder="e.g., SBIN0001234"
                          value={unitForm.ifscCode}
                          onChange={e => handleStep1FieldChange('ifscCode', e.target.value.toUpperCase())}
                          onBlur={() => handleStep1Blur('ifscCode')}
                          className={shouldShowStep1Error('ifscCode') && step1Errors.ifscCode ? 'error' : ''}
                        />
                        {shouldShowStep1Error('ifscCode') && step1Errors.ifscCode && <span className="cds-input-error">{step1Errors.ifscCode}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>Account Balance (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g., 5000"
                          value={unitForm.accountBalance}
                          onChange={e => handleStep1FieldChange('accountBalance', e.target.value)}
                          onBlur={() => handleStep1Blur('accountBalance')}
                          className={shouldShowStep1Error('accountBalance') && step1Errors.accountBalance ? 'error' : ''}
                        />
                        {shouldShowStep1Error('accountBalance') && step1Errors.accountBalance && <span className="cds-input-error">{step1Errors.accountBalance}</span>}
                        {registrationType === 'new' && (
                          <span className="cds-balance-hint">
                            New units typically start with a ₹0 balance.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cds-wizard-card">
                  <div className="cds-wizard-card__header">
                    <Icon d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" size={18} stroke="#1e4731" />
                    <h2>Administrative Notes</h2>
                  </div>
                  <div className="cds-wizard-card__body">
                    <textarea
                      placeholder="Any specific remarks about the unit formation..."
                      value={unitForm.notes}
                      onChange={e => setUnitForm({ ...unitForm, notes: e.target.value })}
                      rows={5}
                    />
                  </div>
                </div>

                <div className="cds-wizard-actions">
                  <button className="cds-wizard-btn cds-wizard-btn--secondary" onClick={handleSaveDraft}>Save Draft</button>
                  <button className="cds-wizard-btn cds-wizard-btn--primary" onClick={() => {
                    if (validateStep1()) {
                      setCurrentStep(2);
                    }
                  }}>
                    Next: Member Details &rarr;
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="cds-wizard-card">
                  <div className="cds-wizard-card__header">
                    <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" size={18} stroke="#1e4731" />
                    <h2>Add Unit Member</h2>
                  </div>
                  <div className="cds-wizard-card__body">
                    {formErrors.step2 && (
                      <div className="cds-status-alert cds-status-alert--danger cds-step2-alert">
                        {formErrors.step2}
                      </div>
                    )}
                    {formErrors.step2Roles && (
                      <div className="cds-status-alert cds-status-alert--warning cds-step2-alert">
                        {formErrors.step2Roles}
                      </div>
                    )}
                    {/* Excel / CSV Import Section */}
                    <div className="cds-bulk-import-box">
                      <div className="cds-bulk-import-header">
                        <div>
                          <h3 className="cds-bulk-import-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            Bulk Import members via Excel / CSV
                          </h3>
                          <p className="cds-bulk-import-subtitle">
                            Upload Excel or CSV file to add members faster.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={downloadTemplate}
                          className="cds-text-link-btn cds-bulk-import-template-btn"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                          Template.csv
                        </button>
                      </div>

                      <div className="cds-bulk-import-file-row">
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                          id="cds-member-file-upload"
                        />
                        <label
                          htmlFor="cds-member-file-upload"
                          className="cds-action-btn cds-action-btn--secondary cds-bulk-import-file-label"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                          Select Excel / CSV File
                        </label>
                      </div>

                      {importedMembers.length > 0 && (
                        <div className="cds-bulk-import-status">
                          <span className="cds-bulk-import-status-label">
                            Loaded {importedMembers.length} members. Processing {currentImportIndex + 1} of {importedMembers.length}.
                          </span>
                          <div className="cds-bulk-import-status-actions">
                            <button
                              type="button"
                              onClick={handleSkipImportedMember}
                              className="cds-action-btn cds-bulk-import-skip-btn"
                            >
                              Skip
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelImport}
                              className="cds-action-btn cds-bulk-import-cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="cds-form-grid">
                      <div className="cds-form-group">
                        <label>Member Name</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={newMember.name}
                          onChange={e => handleMemberFieldChange('name', e.target.value)}
                          className={shouldShowError('name') && liveErrors.memberName ? 'error' : ''}
                        />
                        {shouldShowError('name') && liveErrors.memberName && <span className="cds-input-error">{liveErrors.memberName}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>Age</label>
                        <input
                          type="number"
                          placeholder="Age (Min 18)"
                          value={newMember.age}
                          onChange={e => handleMemberFieldChange('age', e.target.value)}
                          className={shouldShowError('age') && liveErrors.memberAge ? 'error' : ''}
                        />
                        {shouldShowError('age') && liveErrors.memberAge && <span className="cds-input-error">{liveErrors.memberAge}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          placeholder="+91 00000 00000"
                          value={newMember.phone}
                          onChange={e => handleMemberFieldChange('phone', e.target.value)}
                          className={shouldShowError('phone') && liveErrors.memberPhone ? 'error' : ''}
                        />
                        {shouldShowError('phone') && liveErrors.memberPhone && <span className="cds-input-error">{liveErrors.memberPhone}</span>}
                      </div>

                      <div className="cds-form-group">
                        <label>Designation / Role</label>
                        <select
                          value={newMember.role}
                          onChange={e => handleMemberFieldChange('role', e.target.value)}
                        >
                          <option value="Member">Member</option>
                          <option value="President">President</option>
                          <option value="Secretary">Secretary</option>
                          <option value="Treasurer">Treasurer</option>
                        </select>
                      </div>

                      <div className="cds-form-group">
                        <label>House Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Hillview House"
                          value={newMember.houseName}
                          onChange={e => handleMemberFieldChange('houseName', e.target.value)}
                          className={shouldShowError('houseName') && liveErrors.memberHouseName ? 'error' : ''}
                        />
                        {shouldShowError('houseName') && liveErrors.memberHouseName && <span className="cds-input-error">{liveErrors.memberHouseName}</span>}
                      </div>
                    </div>
                    <button className="cds-action-btn cds-action-btn--primary cds-add-member-btn" onClick={handleAddMember}>
                      + Add Member
                    </button>

                  </div>
                </div>

                <div className="cds-wizard-card">
                  <div className="cds-wizard-card__header">
                    <h2>Members List ({members.length})</h2>
                  </div>
                  <div className="cds-wizard-card__body cds-members-card-body">
                    {members.length === 0 ? (
                      <div className="cds-members-empty">
                        No members added yet. A minimum of 10 members is required.
                      </div>
                    ) : (
                      <div className="cds-table-wrap">
                        <table className="cds-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Age</th>
                              <th>Phone</th>
                              <th>House Name</th>
                              <th>Role</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map(m => (
                              <tr key={m.id}>
                                <td><strong>{m.name}</strong></td>
                                <td>{m.age}</td>
                                <td>{m.phone}</td>
                                <td>{m.houseName}</td>
                                <td>
                                  <span className={`cds-role-badge cds-role-badge--${m.role.toLowerCase()}`}>
                                    {m.role}
                                  </span>
                                </td>
                                <td>
                                  <button className="cds-action-btn cds-remove-member-btn" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cds-wizard-actions">
                  <button className="cds-wizard-btn cds-wizard-btn--secondary" onClick={() => setCurrentStep(1)}>&larr; Back: Unit Info</button>
                  <button className="cds-wizard-btn cds-wizard-btn--primary" onClick={() => {
                    if (validateStep2()) {
                      setCurrentStep(3);
                    }
                  }}>
                    Next: Review &rarr;
                  </button>
                </div>
              </>
            )}

            {currentStep === 3 && (() => {
              const selectedWardObj = wardsList.find(w => w.wardId === parseInt(unitForm.ward, 10));
              const wardDisplay = selectedWardObj ? `Ward ${selectedWardObj.wardNumber} - ${selectedWardObj.wardName}` : `Ward ${unitForm.ward}`;
              return (
                <>
                  <div className="cds-wizard-card">
                    <div className="cds-wizard-card__header">
                      <h2>Review Unit Details</h2>
                    </div>
                    <div className="cds-wizard-card__body">
                      <div className="cds-review-section">
                        <h3>Unit Information</h3>
                        <div className="cds-review-grid">
                          <div><strong>Unit Name:</strong> {unitForm.name}</div>
                          <div><strong>Ward/Location:</strong> {wardDisplay}</div>
                          <div><strong>Formation Date:</strong> {unitForm.formationDate}</div>
                          <div><strong>Contact:</strong> {unitForm.contact}</div>
                        </div>
                        {unitForm.notes && (
                          <div className="cds-review-notes-wrap">
                            <strong>Notes:</strong>
                            <p className="cds-review-notes-text">{unitForm.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="cds-review-section cds-review-section--bank">
                        <h3>Bank Details</h3>
                        <div className="cds-review-grid">
                          <div><strong>Bank Name:</strong> {unitForm.bankName}</div>
                          <div><strong>Account Number:</strong> {unitForm.accountNumber}</div>
                          <div><strong>IFSC Code:</strong> {unitForm.ifscCode}</div>
                          <div><strong>Account Balance:</strong> ₹{parseFloat(unitForm.accountBalance || 0).toLocaleString('en-IN')}</div>
                          <div><strong>Registration Type:</strong> <span className="cds-review-reg-type">{registrationType} Unit</span></div>
                        </div>
                      </div>

                      <div className="cds-review-section cds-review-section--members">
                        <h3>Members List ({members.length})</h3>
                        <div className="cds-table-wrap cds-review-members-table">
                          <table className="cds-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Phone</th>
                                <th>House Name</th>
                                <th>Role</th>
                              </tr>
                            </thead>
                            <tbody>
                              {members.map(m => (
                                <tr key={m.id}>
                                  <td><strong>{m.name}</strong></td>
                                  <td>{m.age}</td>
                                  <td>{m.phone}</td>
                                  <td>{m.houseName}</td>
                                  <td>
                                    <span className={`cds-role-badge cds-role-badge--${m.role.toLowerCase()}`}>
                                      {m.role}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="cds-wizard-actions">
                    <button className="cds-wizard-btn cds-wizard-btn--secondary" onClick={() => setCurrentStep(2)}>&larr; Back: Members</button>
                    <button
                      className="cds-wizard-btn cds-wizard-btn--primary"
                      onClick={handleRegisterSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Registering..." : "Confirm & Register"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Right Column (Instructions, Progress, Formations) */}
          <div className="cds-wizard-sidebar">
            <div className="cds-wizard-card cds-wizard-card--instruction">
              <div className="cds-wizard-card__header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a6e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cds-instruction-header-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h2>CDS Admin Instructions</h2>
              </div>
              <div className="cds-wizard-card__body">
                <ul className="cds-instruction-list">
                  <li>A minimum of 10 members and a maximum of 20 are required for a standard unit.</li>
                  <li>Ensure the unit name does not conflict with existing units in the same Ward.</li>
                  <li>Formation date must be the date of the first general body meeting.</li>
                </ul>
              </div>
            </div>

            <div className="cds-wizard-card">
              <div className="cds-wizard-card__header">
                <h2>Recent Formations</h2>
              </div>
              <div className="cds-wizard-card__body cds-members-card-body">
                <div className="cds-recent-formations-list">
                  <div className="cds-recent-formation-item">
                    <span className="cds-dot cds-dot--green" />
                    <div className="cds-recent-formation-info">
                      <h4>Aiswarya Unit</h4>
                      <p>Registered 2 days ago</p>
                    </div>
                  </div>
                  <div className="cds-recent-formation-item">
                    <span className="cds-dot cds-dot--orange" />
                    <div className="cds-recent-formation-info">
                      <h4>Surabhi Unit</h4>
                      <p>Pending Approval</p>
                    </div>
                  </div>
                </div>
                <div className="cds-recent-formations-footer">
                  <button className="cds-text-link-btn" onClick={() => setActiveNav('unit')}>View History</button>
                </div>
              </div>
            </div>

            <div className="cds-progress-panel">
              <h3>Unit Registration Progress</h3>
              <div className="cds-progress-bar-wrap">
                <div className="cds-progress-bar-fill" style={{ width: `${currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100}%` }} />
              </div>
              <p>Step {currentStep} of 3: {currentStep === 1 ? "Collecting Base Data" : currentStep === 2 ? "Adding Unit Members" : "Final Verification"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ══ RECORD SELECTION MODAL ══ */}
      {isRecordModalOpen && (
        <div className="cds-modal-overlay">
          <div className="cds-modal-card">
            <button className="cds-modal-close" onClick={() => setIsRecordModalOpen(false)}>
              &times;
            </button>
            <div className="cds-modal-header">
              <h2>Create New Record</h2>
              <p>Select the type of unit registration you would like to proceed with.</p>
            </div>

            <div className="cds-modal-body">
              <div className="cds-record-options">
                <div className="cds-record-option-card" onClick={() => {
                  setRegistrationType('existing');
                  setUnitForm({
                    name: '',
                    ward: '',
                    formationDate: '',
                    contact: '',
                    notes: '',
                    accountNumber: '',
                    bankName: '',
                    ifscCode: '',
                    accountBalance: ''
                  });
                  setStep1Touched({});
                  setShowStep1Errors(false);
                  setIsRecordModalOpen(false);
                  setActiveNav('register-unit');
                  setCurrentStep(1);
                }}>
                  <div className="cds-record-option-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a6e38" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <h3>Existing Unit</h3>
                  <p>Register and migrate an already active group to this CDS admin zone.</p>
                  <span className="cds-action-badge cds-existing-unit-badge">Start Wizard &rarr;</span>
                </div>

                <div className="cds-record-option-card cds-record-option-card--primary" onClick={() => {
                  setRegistrationType('new');
                  setUnitForm({
                    name: '',
                    ward: '',
                    formationDate: '',
                    contact: '',
                    notes: '',
                    accountNumber: '',
                    bankName: '',
                    ifscCode: '',
                    accountBalance: '0'
                  });
                  setStep1Touched({});
                  setShowStep1Errors(false);
                  setIsRecordModalOpen(false);
                  setActiveNav('register-unit');
                  setCurrentStep(1);
                }}>
                  <div className="cds-record-option-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                  </div>
                  <h3>New Unit</h3>
                  <p>Establish and register a brand new Ayalkoottam unit with step-by-step guidance.</p>
                  <span className="cds-action-badge">Start Wizard &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ SUCCESS MODAL ══ */}
      {isSuccessModalOpen && (
        <div className="cds-modal-overlay">
          <div className="cds-modal-card cds-modal-card--success cds-success-modal">
            <div className="cds-success-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2a6e38" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="cds-success-title">Registration Successful!</h2>
            <p className="cds-success-desc">The unit <strong>{unitForm.name}</strong> has been registered under <strong>{unitForm.ward}</strong>.</p>
            <p className="cds-success-sub-desc">
              The registration code is generated and ready for retrieval.
            </p>

            <div className="cds-success-actions">
              <button className="cds-action-btn cds-action-btn--primary" onClick={downloadReceipt}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cds-download-receipt-icon"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                Download Receipt
              </button>
              <button className="cds-action-btn" onClick={() => {
                setIsSuccessModalOpen(false);
                setUnitForm({
                  name: '',
                  ward: '',
                  formationDate: '',
                  contact: '',
                  notes: '',
                  accountNumber: '',
                  bankName: '',
                  ifscCode: '',
                  accountBalance: '0'
                });
                setMembers([]);
                setActiveNav('dashboard');
              }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ WIZARD SCREEN ══ */}
      {activeNav === 'register-unit' && renderWizard()}
    </>
  );
}

export default RegisterUnitWizard;
