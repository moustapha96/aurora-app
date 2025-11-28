/**
 * OCR Text Extraction Utility
 * Provides multiple methods to extract text from ID card images
 */

export interface ExtractedData {
  firstName?: string;
  lastName?: string;
  rawText?: string;
}

/**
 * Extract text from image using Tesseract.js (client-side OCR)
 * This is a fallback when Edge Function is not available
 */
export const extractTextWithTesseract = async (
  imageBase64: string
): Promise<ExtractedData> => {
  try {
    // Dynamically import Tesseract.js to avoid loading it if not needed
    const Tesseract = await import('tesseract.js');
    
    const { data: { text } } = await Tesseract.default.recognize(imageBase64, 'fra+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Parse the extracted text to find names
    const parsed = parseExtractedText(text);
    return parsed;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw error;
  }
};

/**
 * Parse extracted text to find first name and last name
 * Supports French and English ID card formats
 */
const parseExtractedText = (text: string): ExtractedData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let firstName = '';
  let lastName = '';
  
  // Patterns for French labels
  const firstNamePatterns = [
    /pr[ée]nom/i,
    /pr[ée]noms/i,
    /first\s*name/i,
    /given\s*name/i,
    /forename/i
  ];
  
  const lastNamePatterns = [
    /^nom\s*[:=]?/i,
    /^nom\s+de\s+famille/i,
    /last\s*name/i,
    /family\s*name/i,
    /surname/i,
    /^name\s*[:=]?/i
  ];
  
  // Process lines to find names
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    
    // Check if current line contains a label and next line contains the value
    for (const pattern of firstNamePatterns) {
      if (pattern.test(line)) {
        // Check if next line contains the actual name
        const nameValue = extractNameFromLine(nextLine);
        if (nameValue && !firstName) {
          firstName = nameValue;
          break;
        }
        // Also check if name is on the same line after the label
        const sameLineMatch = line.match(new RegExp(pattern.source + '\\s*[:=]?\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\\s]+)', 'i'));
        if (sameLineMatch && sameLineMatch[1]) {
          const extracted = extractNameFromLine(sameLineMatch[1]);
          if (extracted && !firstName) {
            firstName = extracted;
            break;
          }
        }
      }
    }
    
    for (const pattern of lastNamePatterns) {
      if (pattern.test(line)) {
        // Check if next line contains the actual name
        const nameValue = extractNameFromLine(nextLine);
        if (nameValue && !lastName) {
          lastName = nameValue;
          break;
        }
        // Also check if name is on the same line after the label
        const sameLineMatch = line.match(new RegExp(pattern.source + '\\s*[:=]?\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\\s]+)', 'i'));
        if (sameLineMatch && sameLineMatch[1]) {
          const extracted = extractNameFromLine(sameLineMatch[1]);
          if (extracted && !lastName) {
            lastName = extracted;
            break;
          }
        }
      }
    }
  }
  
  // If we didn't find names using labels, try pattern matching on all lines
  if (!firstName && !lastName) {
    const potentialNames: string[] = [];
    const namePattern = /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s]{2,30}$/;
    
    for (const line of lines) {
      // Skip common ID card labels and metadata
      if (
        line.match(/^(NOM|PRÉNOM|NAME|FIRST|LAST|DATE|BIRTH|NÉ|NÉE|NATIONALITÉ|NATIONALITY|REPUBLIQUE|REPUBLIC|CARTE|CARD|IDENTITÉ|IDENTITY|CEDEAO|ECOWAS|N°|NUMBER|SEXE|SEX|TAILLE|HEIGHT|LIEU|PLACE|DÉLIVRANCE|ISSUE|EXPIRATION|ADRESSE|ADDRESS|CENTRE|CENTER)/i) ||
        line.match(/^\d+$/) || // Skip numbers only
        line.match(/^[^A-Z]*$/) || // Skip lines without uppercase letters
        line.length < 2 || // Skip very short lines
        line.length > 50 || // Skip very long lines
        line.match(/[=_-]{3,}/) // Skip separator lines
      ) {
        continue;
      }
      
      // Check if line matches name pattern (all caps, 2-30 chars)
      if (namePattern.test(line)) {
        const words = line.split(/\s+/).filter(w => w.length > 0);
        if (words.length >= 1 && words.length <= 5) {
          potentialNames.push(line);
        }
      }
    }
    
    // If we found potential names, try to extract first and last name
    if (potentialNames.length >= 1) {
      // First potential name is usually first name
      const firstCandidate = potentialNames[0];
      const words = firstCandidate.split(/\s+/).filter(w => w.length > 0);
      
      if (words.length >= 1 && !firstName) {
        firstName = words[0];
      }
      
      // If there are more words in the first candidate, they might be part of first name
      // Or if there's a second candidate, it might be last name
      if (potentialNames.length >= 2 && !lastName) {
        lastName = potentialNames[1].split(/\s+/).filter(w => w.length > 0).join(' ');
      } else if (words.length >= 2 && !lastName) {
        // If first candidate has multiple words, second word onwards might be last name
        lastName = words.slice(1).join(' ');
      }
    }
  }
  
  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    rawText: text
  };
};

/**
 * Extract a clean name from a line, removing special characters and numbers
 */
const extractNameFromLine = (line: string): string | null => {
  if (!line) return null;
  
  // Remove common prefixes/suffixes and clean the line
  let cleaned = line
    .replace(/^[^A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]*/, '') // Remove leading non-uppercase
    .replace(/[^A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s-']/g, '') // Keep only letters, spaces, hyphens, apostrophes
    .trim();
  
  // Check if it looks like a name (at least 2 characters, mostly letters)
  if (cleaned.length >= 2 && cleaned.length <= 50) {
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 1 && words.length <= 5) {
      return cleaned;
    }
  }
  
  return null;
};

/**
 * Extract text using Supabase Edge Function (primary method)
 */
export const extractTextWithEdgeFunction = async (
  imageBase64: string,
  supabase: any
): Promise<ExtractedData> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-id-card', {
      body: { imageBase64 }
    });

    if (error) {
      throw error;
    }

    return {
      firstName: data?.firstName || '',
      lastName: data?.lastName || ''
    };
  } catch (error) {
    console.error('Edge Function error:', error);
    throw error;
  }
};

/**
 * Main extraction function with fallback
 * Tries Edge Function first, falls back to Tesseract.js if needed
 */
export const extractTextFromImage = async (
  imageBase64: string,
  supabase: any,
  useClientOCR: boolean = false
): Promise<ExtractedData> => {
  // If client OCR is explicitly requested or Edge Function fails
  if (useClientOCR) {
    return await extractTextWithTesseract(imageBase64);
  }

  // Try Edge Function first
  try {
    return await extractTextWithEdgeFunction(imageBase64, supabase);
  } catch (error) {
    console.warn('Edge Function failed, trying client-side OCR...', error);
    // Fallback to client-side OCR
    try {
      return await extractTextWithTesseract(imageBase64);
    } catch (ocrError) {
      console.error('Both extraction methods failed:', ocrError);
      throw new Error('Text extraction failed. Please fill in manually.');
    }
  }
};

