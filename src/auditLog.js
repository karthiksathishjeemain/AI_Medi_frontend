// Function to create an audit log
const apiBaseUrl = 'https://ai-medi-backend.vercel.app';
// const apiBaseUrl = 'http://localhost:5000';
export async  function createAuditLog(action_type, token,details) {
  try {
    // Get device information
    const device = getDeviceInfo();

    // Get location (approximate based on timezone)
    const location = getLocationFromTimezone();

    // Call the audit log API
    const response = await fetch(`${apiBaseUrl}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action_type: action_type,
        device: device,
        location: location,
        details: details
      })
    });

    if (!response.ok) {
      console.error('Failed to create audit log');
    }

    return true;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // We don't want to break the main functionality if logging fails
    return false;
  }
}

// Helper function to get device information
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  let deviceInfo = '';

  // Check for mobile devices first
  if (/Android/i.test(userAgent)) {
    deviceInfo = `Android ${getMobileOSVersion(userAgent, 'Android')}`;
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    deviceInfo = `iOS ${getMobileOSVersion(userAgent, 'iPhone OS')}`;
  } else if (/Windows/i.test(userAgent)) {
    deviceInfo = `Windows ${getOSVersion(userAgent, 'Windows')}`;
  } else if (/Mac/i.test(userAgent)) {
    deviceInfo = 'MacOS';
  } else if (/Linux/i.test(userAgent)) {
    deviceInfo = 'Linux';
  } else {
    deviceInfo = 'Unknown Device';
  }

  // Add browser information
  if (/Chrome/i.test(userAgent)) {
    deviceInfo += ' - Chrome';
  } else if (/Firefox/i.test(userAgent)) {
    deviceInfo += ' - Firefox';
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    deviceInfo += ' - Safari';
  } else if (/Edge/i.test(userAgent)) {
    deviceInfo += ' - Edge';
  }

  return deviceInfo;
}

// Helper function to extract OS version
function getMobileOSVersion(userAgent, osName) {
  const regex = new RegExp(`${osName} ([0-9._]+)`, 'i');
  const matches = userAgent.match(regex);
  return matches ? matches[1] : '';
}

function getOSVersion(userAgent, osName) {
  if (osName === 'Windows') {
    if (/Windows NT 10.0/i.test(userAgent)) return '10';
    if (/Windows NT 6.3/i.test(userAgent)) return '8.1';
    if (/Windows NT 6.2/i.test(userAgent)) return '8';
    if (/Windows NT 6.1/i.test(userAgent)) return '7';
    return '';
  }
  return '';
}

// Helper function to estimate location based on timezone
function getLocationFromTimezone() {
  // This is a simple approximation based on timezone
  const timezoneOffset = new Date().getTimezoneOffset();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Extract region from timezone (e.g., "America/New_York" -> "America")
  let location = '';
  if (timezone) {
    const parts = timezone.split('/');
    if (parts.length > 1) {
      // Use city name and replace underscores with spaces
      location = parts[1].replace(/_/g, ' ');
    } else {
      location = parts[0];
    }
  }

  // Fallback if timezone parsing failed
  if (!location) {
    console.log('Making a guess based on timezone offset:', timezoneOffset);
    // Very rough approximation based on UTC offset
    if (timezoneOffset <= -600) return 'East Asia/Pacific';
    if (timezoneOffset <= -300) return 'Asia';
    if (timezoneOffset <= 0) return 'Europe/Africa';
    if (timezoneOffset <= 300) return 'Americas';
    return 'Pacific Region';
  }

  return location;
}
