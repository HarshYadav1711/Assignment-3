# LLM Prompt Design: Anti-Plagiarism and Anti-Hallucination

## Overview

The article improvement prompt is carefully designed to use LLM as a **content assistant** rather than a content generator, ensuring original output while avoiding plagiarism and hallucination.

## Prompt Structure

### 1. Role Definition
```
"You are a professional content editor helping to improve an article."
```
- Establishes the LLM as an editor, not a writer
- Sets expectation for improvement, not generation

### 2. Clear Task Definition
```
"Your task is to enhance the clarity, structure, and depth of the original article 
while preserving its factual intent."
```
- Focuses on improvement, not creation
- Emphasizes preservation of facts

### 3. Reference Article Usage
```
"Use the reference articles ONLY as examples of good formatting, structure, and 
informational richness - DO NOT copy their content"
```
- Explicitly limits reference usage to style/structure
- Prohibits content copying

### 4. Original Expression Requirement
```
"Express all ideas in your own original words - never copy text verbatim from 
the original or references"
```
- Mandates original language
- Prohibits verbatim copying from any source

### 5. Factual Preservation
```
"Preserve the factual intent and main points of the original article"
```
- Ensures core facts remain unchanged
- Prevents addition of new, unsupported information

## Anti-Plagiarism Mechanisms

### 1. Explicit "Rewrite, Not Copy" Instruction
The prompt contains multiple explicit instructions:
- "This is a rewrite, not a copy"
- "Every sentence should be in your own words"
- "Never copy text verbatim"

**Why it works:** Clear, repeated instructions reduce the likelihood of verbatim copying. LLMs respond well to explicit constraints.

### 2. Reference Articles as Style Guides Only
```
"The reference articles are style guides only - do not extract information from them."
```
**Why it works:** By explicitly stating references are for style only, the LLM is less likely to extract and copy content from them.

### 3. Emphasis on Original Expression
The prompt emphasizes "original words" and "your own words" multiple times.

**Why it works:** Repetition of key concepts helps LLMs prioritize those constraints in their output.

### 4. API-Level Anti-Repetition Settings
```javascript
frequency_penalty: 0.3,  // Discourages repetition
presence_penalty: 0.3   // Encourages variety
```
**Why it works:** These parameters at the API level reduce repetitive patterns that could indicate copying.

## Anti-Hallucination Mechanisms

### 1. No Citation Instructions
The prompt explicitly states:
```
"Do NOT add citations, references, or external links"
```
**Why it works:** Prevents the LLM from inventing citations or references that don't exist. Many LLMs have a tendency to add citations when not explicitly told not to.

### 2. No New Facts Instruction
```
"Do NOT invent facts, statistics, or claims not present in the original"
```
**Why it works:** Explicitly prohibits adding new information, reducing hallucination of facts.

### 3. Focus on Improvement, Not Addition
```
"Focus on improving what exists, not adding new information."
```
**Why it works:** Shifts focus from generation to improvement, reducing the likelihood of adding unsupported content.

### 4. Preserve Factual Intent
```
"Preserve the factual intent and main points of the original article"
```
**Why it works:** Emphasizes preservation over addition, reducing hallucination.

### 5. No Reference Article Citation
```
"Do NOT mention the reference articles or cite them in any way"
```
**Why it works:** Prevents the LLM from creating false citations to the reference articles.

## Temperature and Model Settings

### Temperature: 0.7
- Balanced between creativity and consistency
- Low enough to reduce hallucination
- High enough to allow varied expression (reducing plagiarism risk)

### Frequency/Presence Penalties: 0.3
- Encourages varied language
- Reduces repetitive patterns
- Helps prevent verbatim copying

## Output Formatting

### No Markdown Instruction
```
"Output ONLY the improved article content - no explanations, no markdown formatting, no metadata"
```
**Why it works:** Prevents markdown abuse and ensures clean, readable output.

### Cleanup in Code
The function also removes any markdown artifacts that might slip through:
```javascript
improvedContent = improvedContent
  .replace(/^```[\w]*\n/g, '')
  .replace(/\n```$/g, '')
  .trim();
```

## Why This Approach Works

### 1. Multiple Layers of Protection
- Prompt-level instructions
- API-level parameters
- Post-processing cleanup

### 2. Clear Constraints
- Explicit "do not" instructions
- Clear boundaries on what to do and not do

### 3. Focus on Task
- Improvement, not generation
- Editing, not writing
- Preservation, not addition

### 4. Reference Limitation
- References are explicitly limited to style/structure
- No instruction to extract information from references

## Testing and Validation

The prompt design can be tested by:
1. Checking output for verbatim copying (string matching)
2. Checking for invented citations or references
3. Verifying factual content matches original
4. Ensuring original expression throughout

## Limitations

1. **Not 100% Guaranteed**: No prompt can guarantee zero plagiarism or hallucination
2. **Model Dependent**: Effectiveness varies by LLM model
3. **Requires Review**: Human review is still recommended
4. **Context Dependent**: Some topics may be more prone to issues

## Best Practices

1. Always review LLM output
2. Use plagiarism detection tools as a secondary check
3. Verify facts match the original
4. Adjust temperature/penalties based on results
5. Consider using multiple models and comparing outputs

