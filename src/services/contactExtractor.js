/**
 * Extract contact information from resume text
 */
export class ContactExtractor {
  
  /**
   * Extract email addresses from text
   */
  static extractEmail(text) {
    // Common email regex pattern
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const emails = text.match(emailRegex);
    
    if (emails && emails.length > 0) {
      // Return the first valid email (usually the primary one)
      return emails[0].toLowerCase();
    }
    return null;
  }

  /**
   * Extract phone numbers from text
   * Handles various formats: +63, 09xx, with/without country code
   */
  static extractPhoneNumber(text) {
    // Phone number patterns for Philippines and international
    const patterns = [
      // Philippine mobile: +639xxxxxxxxx or 639xxxxxxxxx or 09xxxxxxxxx
      /(\+63|0)?[9]\d{9}/g,
      // Philippine landline: (02) 1234567, 02-1234567, 021234567
      /(\(?0[2-8]\)?)[- ]?\d{6,7}/g,
      // International: +1 123 456 7890
      /\+\d{1,3}[- ]?\d{3}[- ]?\d{3}[- ]?\d{4}/g,
      // Simple: 123-456-7890, 123.456.7890, 123 456 7890
      /\d{3}[- .]\d{3}[- .]\d{4}/g,
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Clean and format the phone number
        return this.cleanPhoneNumber(matches[0]);
      }
    }
    return null;
  }

  /**
   * Clean and format phone number
   */
  static cleanPhoneNumber(phone) {
    // Remove spaces, dashes, dots, parentheses
    let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    
    // Ensure +63 format for Philippine numbers
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '+63' + cleaned.substring(1);
    } else if (cleaned.startsWith('63') && cleaned.length === 12 && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Extract candidate name from resume
   * Usually appears at the beginning of the resume
   */
  static extractName(text) {
    // Split into lines and look for name patterns at the top
    const lines = text.split('\n').slice(0, 20); // Check first 20 lines
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip short lines or lines with all caps (often headings)
      if (trimmed.length < 3 || trimmed.length > 50) continue;
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 5) continue;
      
      // Check if line looks like a name (2-4 words, starts with capital letters)
      const words = trimmed.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        const hasCapitalPattern = words.every(word => 
          /^[A-Z][a-z]*$/.test(word) || /^[A-Z][a-z]*\.[A-Z][a-z]*$/.test(word)
        );
        
        if (hasCapitalPattern) {
          return trimmed;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract location from resume
   */
  static extractLocation(text) {
    // Common location patterns
    const locationKeywords = ['Location:', 'Address:', 'Based in:', 'City:', 'Country:'];
    const lines = text.split('\n');
    
    for (const line of lines) {
      for (const keyword of locationKeywords) {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          const location = line.split(':')[1]?.trim();
          if (location && location.length > 2 && location.length < 50) {
            return location;
          }
        }
      }
    }
    
    // Look for city names (simple pattern - can be enhanced)
    const cityPattern = /(Manila|Cebu|Davao|Quezon City|Makati|BGC|Taguig|Pasig|Mandaluyong|Muntinlupa|Paranaque|Las Pinas|Caloocan|Malabon|Navotas|Valenzuela|Marikina|Pasay|Pateros|San Juan)/i;
    const match = text.match(cityPattern);
    if (match) {
      return match[0];
    }
    
    return null;
  }

  /**
   * Extract all contact information
   */
  static extractAll(text) {
    console.log("🔍 Extracting contact information from resume...");
    
    const contactInfo = {
      email: this.extractEmail(text),
      phone: this.extractPhoneNumber(text),
      name: this.extractName(text),
      location: this.extractLocation(text),
    };
    
    console.log(`📧 Email found: ${contactInfo.email || 'Not found'}`);
    console.log(`📱 Phone found: ${contactInfo.phone || 'Not found'}`);
    console.log(`👤 Name found: ${contactInfo.name || 'Not found'}`);
    console.log(`📍 Location found: ${contactInfo.location || 'Not found'}`);
    
    return contactInfo;
  }
}