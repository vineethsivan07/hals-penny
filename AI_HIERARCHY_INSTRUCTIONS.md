# AI HIERARCHY INSTRUCTIONS - DO NOT MODIFY

## 🚨 CRITICAL: AI HIERARCHY MUST NEVER BE CHANGED

### **MANDATORY AI HIERARCHY (NEVER MODIFY)**

The AI hierarchy is **FIXED** and must **ALWAYS** follow this exact order:

```
🥇 Anthropic Claude → 🥈 OpenAI → 🥉 Fallback Regex
```

### **APPLIES TO ALL OPERATIONS:**

1. **Message Detection** (detectQuery)
2. **Expense Parsing** (parseExpense) 
3. **Query Processing** (processQuery)
4. **Response Generation** (all AI responses)

### **IMPLEMENTATION RULES:**

1. **ALWAYS try Anthropic first** (if available)
2. **ONLY if Anthropic fails**, try OpenAI
3. **ONLY if both AI services fail**, use fallback
4. **NEVER skip AI services** to go directly to fallback
5. **NEVER hardcode fallback** as the primary method

### **CODE PATTERN (MUST FOLLOW):**

```javascript
// ✅ CORRECT - Always use this pattern
if (anthropicService.isAvailable) {
  try {
    result = await anthropicService.method();
    serviceUsed = 'anthropic';
  } catch (error) {
    result = null;
  }
}

if (!result && openaiService.isAvailable) {
  try {
    result = await openaiService.method();
    serviceUsed = 'openai';
  } catch (error) {
    result = null;
  }
}

if (!result) {
  result = fallbackMethod();
  serviceUsed = 'fallback';
}
```

### **❌ FORBIDDEN PATTERNS:**

```javascript
// ❌ NEVER DO THIS - Hardcoded fallback
result = fallbackMethod();

// ❌ NEVER DO THIS - Skip AI services
console.log('Using fallback due to AI issues...');

// ❌ NEVER DO THIS - Bypass hierarchy
if (someCondition) {
  result = fallbackMethod();
}
```

### **ENFORCEMENT:**

- **This file is READ-ONLY**
- **Any agent that modifies the AI hierarchy will be in violation**
- **The hierarchy is PERMANENT and UNCHANGEABLE**
- **Only the user can request hierarchy modifications**

### **LAST UPDATED:** 2025-10-19
### **STATUS:** ENFORCED - DO NOT MODIFY
