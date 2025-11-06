export function analyzeRequest(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();

  const category = categorizeRequest(text);
  const priority = determinePriority(text);
  const aiResponse = generateResponse(title, category);
  const assignedUnit = getAssignedUnit(category);

  return { category, priority, aiResponse, assignedUnit };
}

function categorizeRequest(text: string): string {
  if (text.match(/computer|laptop|software|network|internet|wifi|password|email|printer|it|technical|system/i)) {
    return 'IT and Technical Support';
  }

  if (text.match(/clean|room|office|repair|maintenance|hvac|air condition|heating|ventilation|building/i)) {
    return 'Facilities and Maintenance';
  }

  if (text.match(/desk|chair|furniture|equipment|table|cabinet|storage|supplies/i)) {
    return 'Equipment and Furniture';
  }

  if (text.match(/safety|fire|emergency|hazard|accident|injury|security|alarm|evacuation/i)) {
    return 'Safety and Fire Protection';
  }

  if (text.match(/leave|vacation|payroll|benefits|training|hr|human resource|staff|employee|recruitment/i)) {
    return 'HR and Staff Matters';
  }

  return 'Other';
}

function determinePriority(text: string): string {
  if (text.match(/urgent|emergency|critical|immediate|asap|broken|not working|down|fire|safety|injury/i)) {
    return 'Critical';
  }

  if (text.match(/important|high priority|soon|needed|blocking|cannot work/i)) {
    return 'High';
  }

  if (text.match(/low priority|when possible|not urgent|minor|small/i)) {
    return 'Low';
  }

  return 'Medium';
}

function generateResponse(title: string, category: string): string {
  const responses: Record<string, string> = {
    'IT and Technical Support': `Your request regarding "${title}" has been received and forwarded to the IT and Technical Support Division. Our team will review your request and contact you shortly.`,
    'Facilities and Maintenance': `Your request regarding "${title}" has been received and forwarded to the Facilities and Maintenance Division. A technician will be assigned to address your concern.`,
    'Equipment and Furniture': `Your request regarding "${title}" has been received and forwarded to the Equipment and Furniture Division. We will process your request and notify you of the next steps.`,
    'Safety and Fire Protection': `Your request regarding "${title}" has been received and forwarded to the Safety and Fire Protection Division. This matter will be treated with high priority.`,
    'HR and Staff Matters': `Your request regarding "${title}" has been received and forwarded to the Human Resources Division. An HR representative will contact you to discuss your request.`,
    'Other': `Your request regarding "${title}" has been received. We will review the details and route it to the appropriate department for handling.`
  };

  return responses[category] || responses['Other'];
}

function getAssignedUnit(category: string): string {
  const units: Record<string, string> = {
    'IT and Technical Support': 'IT Division',
    'Facilities and Maintenance': 'Technical Division',
    'Equipment and Furniture': 'Procurement Division',
    'Safety and Fire Protection': 'Safety Division',
    'HR and Staff Matters': 'HR Division',
    'Other': 'General Support'
  };

  return units[category] || 'General Support';
}
