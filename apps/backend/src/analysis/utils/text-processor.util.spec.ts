import { TextProcessor } from "./text-processor.util";

describe("TextProcessor", () => {
  // Test data constants
  const SAMPLE_TEXT =
    "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.";
  const MULTI_PARAGRAPH_TEXT =
    "First paragraph here.\n\nSecond paragraph with more text.\n\nThird paragraph final.";
  const COMPLEX_TEXT =
    "Hello! How are you? I'm fine, thanks. Let's test this... Amazing!\n\nNew paragraph: testing (special) characters & symbols.";

  describe("analyzeText", () => {
    it("should return complete analysis for sample text", () => {
      const result = TextProcessor.analyzeText(SAMPLE_TEXT);

      expect(result.words).toHaveLength(16);
      expect(result.sentences).toHaveLength(2);
      expect(result.paragraphs).toHaveLength(1);
      expect(result.characterCount).toBeGreaterThan(0);
      expect(result.cleanedText).toBeDefined();
    });

    it("should handle empty text", () => {
      const result = TextProcessor.analyzeText("");

      expect(result.words).toEqual([]);
      expect(result.sentences).toEqual([]);
      expect(result.paragraphs).toEqual([]);
      expect(result.characterCount).toBe(0);
      expect(result.cleanedText).toBe("");
    });

    it("should handle null/undefined input", () => {
      const resultNull = TextProcessor.analyzeText(null);
      const resultUndefined = TextProcessor.analyzeText(undefined);

      expect(resultNull.words).toEqual([]);
      expect(resultUndefined.words).toEqual([]);
    });

    it("should handle multi-paragraph text", () => {
      const result = TextProcessor.analyzeText(MULTI_PARAGRAPH_TEXT);

      expect(result.paragraphs).toHaveLength(3);
      expect(result.paragraphs[0]).toContain("first");
      expect(result.paragraphs[1]).toContain("second");
      expect(result.paragraphs[2]).toContain("third");
    });
  });

  describe("extractWords", () => {
    it("should extract words correctly from sample text", () => {
      const words = TextProcessor.extractWords(SAMPLE_TEXT);

      expect(words).toContain("the");
      expect(words).toContain("quick");
      expect(words).toContain("brown");
      expect(words).toContain("fox");
      expect(words).toHaveLength(16);
    });

    it("should convert words to lowercase", () => {
      const words = TextProcessor.extractWords("The QUICK Brown FOX");

      expect(words).toEqual(["the", "quick", "brown", "fox"]);
    });

    it("should handle punctuation removal", () => {
      const words = TextProcessor.extractWords("Hello, world! How are you?");

      expect(words).toEqual(["hello", "world", "how", "are", "you"]);
    });

    it("should handle multiple spaces", () => {
      const words = TextProcessor.extractWords("word1    word2     word3");

      expect(words).toEqual(["word1", "word2", "word3"]);
    });

    it("should handle empty string", () => {
      const words = TextProcessor.extractWords("");

      expect(words).toEqual([]);
    });

    it("should handle whitespace-only string", () => {
      const words = TextProcessor.extractWords("   \n\t   ");

      expect(words).toEqual([]);
    });
  });

  describe("extractSentences", () => {
    it("should extract sentences with period terminator", () => {
      const sentences = TextProcessor.extractSentences(
        "First sentence. Second sentence."
      );

      expect(sentences).toEqual(["First sentence", "Second sentence"]);
    });

    it("should extract sentences with multiple terminators", () => {
      const sentences = TextProcessor.extractSentences(
        "Question? Exclamation! Statement."
      );

      expect(sentences).toEqual(["Question", "Exclamation", "Statement"]);
    });

    it("should handle multiple consecutive terminators", () => {
      const sentences = TextProcessor.extractSentences("Really?! Yes... Okay.");

      expect(sentences).toHaveLength(3);
    });

    it("should handle empty text", () => {
      const sentences = TextProcessor.extractSentences("");

      expect(sentences).toEqual([]);
    });

    it("should handle text without terminators", () => {
      const sentences = TextProcessor.extractSentences("No terminator here");

      expect(sentences).toEqual(["No terminator here"]);
    });

    it("should preserve original text case in sentences", () => {
      const sentences = TextProcessor.extractSentences(
        "First Sentence. SECOND SENTENCE."
      );

      expect(sentences).toEqual(["First Sentence", "SECOND SENTENCE"]);
    });
  });

  describe("extractParagraphs", () => {
    it("should extract paragraphs separated by double newlines", () => {
      const paragraphs = TextProcessor.extractParagraphs(MULTI_PARAGRAPH_TEXT);

      expect(paragraphs).toHaveLength(3);
      expect(paragraphs[0]).toContain("first");
      expect(paragraphs[1]).toContain("second");
      expect(paragraphs[2]).toContain("third");
    });

    it("should handle single paragraph", () => {
      const paragraphs = TextProcessor.extractParagraphs(
        "Single paragraph here"
      );

      expect(paragraphs).toHaveLength(1);
      expect(paragraphs[0]).toEqual(["single", "paragraph", "here"]);
    });

    it("should handle empty paragraphs", () => {
      const paragraphs = TextProcessor.extractParagraphs("Para1\n\n\n\nPara2");

      expect(paragraphs).toHaveLength(2);
    });

    it("should handle empty text", () => {
      const paragraphs = TextProcessor.extractParagraphs("");

      expect(paragraphs).toEqual([]);
    });
  });

  describe("countValidCharacters", () => {
    it("should count only letters and spaces", () => {
      const count = TextProcessor.countValidCharacters("Hello World");

      expect(count).toBe(11); // 10 letters + 1 space
    });

    it("should ignore punctuation", () => {
      const count = TextProcessor.countValidCharacters("Hello, World!");

      expect(count).toBe(11); // 10 letters + 1 space, ignoring comma and exclamation
    });

    it("should ignore numbers", () => {
      const count = TextProcessor.countValidCharacters("Hello 123 World");

      expect(count).toBe(12); // 10 letters + 2 spaces, ignoring numbers
    });

    it("should handle empty string", () => {
      const count = TextProcessor.countValidCharacters("");

      expect(count).toBe(0);
    });

    it("should handle special characters only", () => {
      const count = TextProcessor.countValidCharacters("!@#$%^&*()");

      expect(count).toBe(0);
    });
  });

  describe("findLongestWordsPerParagraph", () => {
    it("should find longest words in single paragraph", () => {
      const result = TextProcessor.findLongestWordsPerParagraph(
        "The quick brown fox"
      );

      expect(result).toHaveLength(1);
      expect(result[0].paragraph).toBe(1);
      expect(result[0].words).toContain("quick");
      expect(result[0].words).toContain("brown");
      expect(result[0].length).toBe(5);
    });

    it("should find longest words in multiple paragraphs", () => {
      const text = "Short word here.\n\nLonger words paragraph.";
      const result = TextProcessor.findLongestWordsPerParagraph(text);

      expect(result).toHaveLength(2);
      expect(result[0].paragraph).toBe(1);
      expect(result[1].paragraph).toBe(2);
    });

    it("should handle ties in word length", () => {
      const result = TextProcessor.findLongestWordsPerParagraph("cat dog fox");

      expect(result[0].words).toHaveLength(3); // All words are length 3
      expect(result[0].words).toEqual(["cat", "dog", "fox"]);
    });

    it("should deduplicate identical longest words", () => {
      const result =
        TextProcessor.findLongestWordsPerParagraph("test test best");

      expect(result[0].words).toEqual(["test", "best"]); // 'test' should appear only once
    });

    it("should handle empty text", () => {
      const result = TextProcessor.findLongestWordsPerParagraph("");

      expect(result).toEqual([]);
    });
  });

  describe("cleanTextForWords", () => {
    it("should remove punctuation and normalize spaces", () => {
      const cleaned = TextProcessor.cleanTextForWords(
        "Hello, world! How are you?"
      );

      expect(cleaned).toBe("Hello world How are you");
    });

    it("should handle multiple consecutive spaces", () => {
      const cleaned = TextProcessor.cleanTextForWords(
        "word1    word2     word3"
      );

      expect(cleaned).toBe("word1 word2 word3");
    });

    it("should trim leading and trailing spaces", () => {
      const cleaned = TextProcessor.cleanTextForWords("  hello world  ");

      expect(cleaned).toBe("hello world");
    });
  });

  describe("validateText", () => {
    it("should validate normal text", () => {
      const result = TextProcessor.validateText("Hello world");

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject null input", () => {
      const result = TextProcessor.validateText(null as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Text must be a non-empty string");
    });

    it("should reject non-string input", () => {
      const result = TextProcessor.validateText(123 as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Text must be a non-empty string");
    });

    it("should reject empty string", () => {
      const result = TextProcessor.validateText("");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Text must be a non-empty string");
    });

    it("should reject whitespace-only string", () => {
      const result = TextProcessor.validateText("   \n\t   ");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Text cannot be empty or only whitespace");
    });

    it("should reject text exceeding max length", () => {
      const longText = "a".repeat(1001);
      const result = TextProcessor.validateText(longText, 1000);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Text length exceeds maximum of 1000 characters"
      );
    });

    it("should accept text within max length", () => {
      const text = "a".repeat(999);
      const result = TextProcessor.validateText(text, 1000);

      expect(result.isValid).toBe(true);
    });
  });

  describe("getWordFrequency", () => {
    it("should count word frequencies correctly", () => {
      const frequency = TextProcessor.getWordFrequency("the cat and the dog");

      expect(frequency.get("the")?.count).toBe(2);
      expect(frequency.get("cat")?.count).toBe(1);
      expect(frequency.get("and")?.count).toBe(1);
      expect(frequency.get("dog")?.count).toBe(1);
    });

    it("should track word positions", () => {
      const frequency = TextProcessor.getWordFrequency("hello world hello");

      expect(frequency.get("hello")?.positions).toEqual([0, 2]);
      expect(frequency.get("world")?.positions).toEqual([1]);
    });

    it("should handle empty text", () => {
      const frequency = TextProcessor.getWordFrequency("");

      expect(frequency.size).toBe(0);
    });
  });

  // Integration tests
  describe("Integration Tests", () => {
    it("should handle the provided sample text correctly", () => {
      const result = TextProcessor.analyzeText(SAMPLE_TEXT);

      // Verify word count
      expect(result.words).toHaveLength(16);

      // Verify sentence count
      expect(result.sentences).toHaveLength(2);
      expect(result.sentences[0]).toContain("fox jumps over");
      expect(result.sentences[1]).toContain("dog slept");

      // Verify paragraph count
      expect(result.paragraphs).toHaveLength(1);

      // Verify character count (letters and spaces only)
      expect(result.characterCount).toBeGreaterThan(60);

      // Verify longest words
      const longestWords =
        TextProcessor.findLongestWordsPerParagraph(SAMPLE_TEXT);
      expect(longestWords[0].words).toContain("quick");
      expect(longestWords[0].words).toContain("brown");
      expect(longestWords[0].words).toContain("jumps");
      expect(longestWords[0].words).toContain("slept");
    });

    it("should handle complex text with multiple features", () => {
      const result = TextProcessor.analyzeText(COMPLEX_TEXT);

      expect(result.sentences.length).toBeGreaterThan(2);
      expect(result.paragraphs).toHaveLength(2);
      expect(result.words.length).toBeGreaterThan(10);
      expect(result.characterCount).toBeGreaterThan(0);
    });
  });
});
