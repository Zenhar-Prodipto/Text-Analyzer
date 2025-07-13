export interface TextAnalysisResult {
  words: string[];
  sentences: string[];
  paragraphs: string[][];
  characterCount: number;
  cleanedText: string;
}

export interface WordFrequency {
  word: string;
  count: number;
  positions: number[]; // Word positions for advanced analysis
}

export class TextProcessor {
  // Pre-compiled regex patterns for performance
  private static readonly SENTENCE_TERMINATORS = /[.!?]+/g;
  private static readonly PARAGRAPH_SEPARATOR = /\n\s*\n/g;
  private static readonly WORD_BOUNDARY = /\s+/g;
  private static readonly PUNCTUATION_REMOVAL = /[^\w\s]/g;
  private static readonly MULTIPLE_SPACES = /\s+/g;
  private static readonly NON_ALPHABETIC = /[^a-zA-Z\s]/g;

  static analyzeText(text: string | null | undefined): TextAnalysisResult {
    if (!text || typeof text !== "string") {
      return {
        words: [],
        sentences: [],
        paragraphs: [],
        characterCount: 0,
        cleanedText: "",
      };
    }

    // Step 1: Clean text for word/character analysis (removes punctuation)
    const cleanedText = this.cleanTextForWords(text);

    // Step 2: Count characters (only letters and spaces)
    const characterCount = this.countValidCharacters(cleanedText);

    // Step 3: Extract sentences BEFORE cleaning
    const sentences = this.extractSentencesFromText(text);

    // Step 4: Extract paragraphs from original text
    const paragraphTexts = this.extractParagraphTexts(text);

    // Step 5: Process each paragraph for words
    const words: string[] = [];
    const paragraphs: string[][] = [];

    for (let i = 0; i < paragraphTexts.length; i++) {
      const paragraphText = paragraphTexts[i];
      const paragraphWords = this.extractWordsFromText(
        this.cleanTextForWords(paragraphText)
      );
      words.push(...paragraphWords);
      paragraphs.push(paragraphWords);
    }

    return {
      words,
      sentences,
      paragraphs,
      characterCount,
      cleanedText,
    };
  }

  // Clean text for word/character analysis - removes punctuation

  static cleanTextForWords(text: string): string {
    return text
      .replace(this.PUNCTUATION_REMOVAL, " ") // Replace punctuation with spaces
      .replace(this.MULTIPLE_SPACES, " ") // Normalize multiple spaces
      .trim(); // Remove leading/trailing spaces
  }

  static cleanText(text: string): string {
    return this.cleanTextForWords(text);
  }

  // Count only alphabetic characters and spaces (ignoring punctuation)

  static countValidCharacters(text: string): number {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (
        (char >= "a" && char <= "z") ||
        (char >= "A" && char <= "Z") ||
        char === " "
      ) {
        count++;
      }
    }
    return count;
  }

  //Extract words with optimal algorithm

  static extractWords(text: string): string[] {
    const cleanedText = this.cleanTextForWords(text);
    return this.extractWordsFromText(cleanedText);
  }

  // Internal method to extract words from already cleaned text

  private static extractWordsFromText(cleanedText: string): string[] {
    if (!cleanedText.trim()) return [];

    return cleanedText
      .toLowerCase()
      .split(this.WORD_BOUNDARY)
      .filter((word) => word.length > 0);
  }

  // Extract sentences using original text (preserves terminators)

  static extractSentences(text: string): string[] {
    return this.extractSentencesFromText(text);
  }

  //Internal method for sentence extraction - uses ORIGINAL text

  private static extractSentencesFromText(text: string): string[] {
    if (!text.trim()) return [];

    // Split by sentence terminators and clean up
    const sentences = text
      .split(this.SENTENCE_TERMINATORS)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);

    return sentences;
  }

  // Extract paragraphs as arrays of words

  static extractParagraphs(text: string): string[][] {
    const paragraphTexts = this.extractParagraphTexts(text);

    return paragraphTexts.map((paragraphText) =>
      this.extractWordsFromText(this.cleanTextForWords(paragraphText))
    );
  }

  // Internal method to extract paragraph texts from original text

  private static extractParagraphTexts(text: string): string[] {
    if (!text.trim()) return [];

    return text
      .split(this.PARAGRAPH_SEPARATOR)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }

  // Find longest words per paragraph with optimal algorithm

  static findLongestWordsPerParagraph(text: string): Array<{
    paragraph: number;
    words: string[];
    length: number;
  }> {
    const paragraphs = this.extractParagraphs(text);
    const result: Array<{
      paragraph: number;
      words: string[];
      length: number;
    }> = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const words = paragraphs[i];
      if (words.length === 0) continue;

      // Find max length in this paragraph
      let maxLength = 0;
      for (const word of words) {
        if (word.length > maxLength) {
          maxLength = word.length;
        }
      }

      // Collect all words with max length
      const longestWords: string[] = [];
      const seenWords = new Set<string>();

      for (const word of words) {
        if (word.length === maxLength && !seenWords.has(word)) {
          longestWords.push(word);
          seenWords.add(word);
        }
      }

      result.push({
        paragraph: i + 1,
        words: longestWords,
        length: maxLength,
      });
    }

    return result;
  }

  // Word frequency analysis with optimal algorithm

  static getWordFrequency(text: string): Map<string, WordFrequency> {
    const words = this.extractWords(text);
    const frequencyMap = new Map<string, WordFrequency>();

    words.forEach((word, index) => {
      if (frequencyMap.has(word)) {
        const existing = frequencyMap.get(word)!;
        existing.count++;
        existing.positions.push(index);
      } else {
        frequencyMap.set(word, {
          word,
          count: 1,
          positions: [index],
        });
      }
    });

    return frequencyMap;
  }

  // Validate text input for analysis

  static validateText(
    text: string,
    maxLength: number = 100000
  ): {
    isValid: boolean;
    error?: string;
  } {
    if (!text || typeof text !== "string") {
      return { isValid: false, error: "Text must be a non-empty string" };
    }

    if (text.length > maxLength) {
      return {
        isValid: false,
        error: `Text length exceeds maximum of ${maxLength} characters`,
      };
    }

    if (text.trim().length === 0) {
      return {
        isValid: false,
        error: "Text cannot be empty or only whitespace",
      };
    }

    return { isValid: true };
  }
}
