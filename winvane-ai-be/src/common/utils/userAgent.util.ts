export type TDeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface IParsedUserAgent {
  browser: string;
  os: string;
  deviceType: TDeviceType;
}

/**
 * Lightweight, zero-dependency User-Agent parser.
 * Covers Chrome, Edge, Firefox, Safari, Opera across Windows, macOS, iOS, Android, Linux.
 */
export function parseUserAgent(uaString?: string | null): IParsedUserAgent {
  if (!uaString || typeof uaString !== 'string') {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'unknown',
    };
  }

  const ua = uaString.trim();

  // 1. Detect OS
  let os = 'Unknown';
  if (/Windows NT|Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux|X11/i.test(ua)) {
    os = 'Linux';
  }

  // 2. Detect Browser (order matters: Edge and Opera contain "Chrome" & "Safari")
  let browser = 'Unknown';
  if (/Edg([ea]|iOS)?\/[0-9.]+/i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/[0-9.]+|Opera\/[0-9.]+/i.test(ua)) {
    browser = 'Opera';
  } else if (/Firefox\/[0-9.]+|FxiOS\/[0-9.]+/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Chrome\/[0-9.]+|CriOS\/[0-9.]+/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\/[0-9.]+/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = 'Safari';
  }

  // 3. Detect Device Type
  let deviceType: TDeviceType = 'unknown';
  if (
    /iPad/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    /tablet/i.test(ua)
  ) {
    deviceType = 'tablet';
  } else if (
    /Mobile|iPhone|iPod/i.test(ua) ||
    (/Android/i.test(ua) && /Mobile/i.test(ua))
  ) {
    deviceType = 'mobile';
  } else if (os === 'Windows' || os === 'macOS' || os === 'Linux') {
    deviceType = 'desktop';
  }

  return {
    browser,
    os,
    deviceType,
  };
}
