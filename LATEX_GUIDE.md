# LaTeX Formatting Guide for Ceibaa Question Sheets

## 📐 How to Use LaTeX in Your Google Sheets

Now that KaTeX is installed, you can use LaTeX mathematical notation in your questions, options, and explanations!

### ✅ Basic LaTeX Syntax

**Inline Math (within text):**
Use single dollar signs: `$...$`

Example: `The value of $x^2$ is greater than $y$`

**Display Math (centered, on its own line):**
Use double dollar signs: `$$...$$`

Example: `$$\frac{a + b}{c}$$`

---

## 📋 Common LaTeX Examples for Your Sheets

### **Fractions:**
- Simple: `$\frac{1}{2}$` → ½
- Complex: `$\frac{a+b}{c-d}$` → (a+b)/(c-d)
- Nested: `$\frac{1}{\frac{2}{3}}$`

### **Exponents & Subscripts:**
- Powers: `$x^2$`, `$a^{10}$`, `$e^{i\pi}$`
- Subscripts: `$x_1$`, `$a_{ij}$`
- Both: `$x_1^2$`

### **Square Roots:**
- Simple: `$\sqrt{x}$`
- nth root: `$\sqrt[3]{x}$` (cube root)
- Complex: `$\sqrt{x^2 + y^2}$`

### **Greek Letters:**
- Lowercase: `$\alpha$`, `$\beta$`, `$\gamma$`, `$\theta$`, `$\pi$`, `$\omega$`
- Uppercase: `$\Gamma$`, `$\Delta$`, `$\Theta$`, `$\Pi$`, `$\Omega$`

### **Trigonometric Functions:**
- `$\sin(x)$`, `$\cos(\theta)$`, `$\tan(x)$`
- `$\sec(x)$`, `$\csc(x)$`, `$\cot(x)$`

### **Logarithms:**
- Natural log: `$\ln(x)$`
- Base 10: `$\log(x)$`
- Custom base: `$\log_2(x)$`

### **Limits:**
```
$\lim_{x \to 0} \frac{\sin(x)}{x}$
```

### **Summation & Integration:**
- Sum: `$\sum_{i=1}^{n} i$`
- Integral: `$\int_0^1 x^2 dx$`
- Product: `$\prod_{i=1}^{n} i$`

### **Calculus:**
- Derivative: `$\frac{d}{dx}$`, `$f'(x)$`
- Partial: `$\frac{\partial f}{\partial x}$`
- Integral: `$\int x^2 dx$`

### **Matrices:**
```
$$\begin{bmatrix} 
a & b \\ 
c & d 
\end{bmatrix}$$
```

### **Equations:**
```
$$ax^2 + bx + c = 0$$
```

### **Complex Numbers:**
- `$z = a + bi$`
- `$|z| = \sqrt{a^2 + b^2}$`
- `$e^{i\theta} = \cos(\theta) + i\sin(\theta)$`

### **Vectors:**
- `$\vec{v}$` or `$\mathbf{v}$`
- Magnitude: `$|\vec{v}|$` or `$\|\vec{v}\|$`

### **Sets & Logic:**
- Set: `$\{1, 2, 3\}$`
- In: `$x \in A$`
- Union: `$A \cup B$`
- Intersection: `$A \cap B$`
- Subset: `$A \subseteq B$`

### **Inequalities:**
- `$x < y$`, `$x \leq y$`
- `$x > y$`, `$x \geq y$`
- `$x \neq y$`

---

## 🎯 Real Example from Your NDA Sheet

**Original (with broken LaTeX):**
```
Question: The complex number $\frac{1}{-1+i\sqrt{3}}$ in polar form is?
```

**Options:**
```
A. $\frac{1}{2}(\cos\frac{\pi}{3} - i\sin\frac{\pi}{3})$
B. $\frac{1}{2}(\cos\frac{\pi}{3} + i\sin\frac{\pi}{3})$
C. $\frac{1}{2}(\cos\frac{2\pi}{3} - i\sin\frac{2\pi}{3})$
D. $\frac{1}{2}(\cos\frac{2\pi}{3} + i\sin\frac{2\pi}{3})$
```

**Explanation:**
```
$-1+i\sqrt{3} = 2e^{i2\pi/3}$. So $\frac{1}{2e^{i2\pi/3}} = \frac{1}{2}e^{-i2\pi/3}$
```

✅ **This will now render beautifully with proper mathematical notation!**

---

## ⚠️ Important Tips:

1. **Use single $ for inline math** in questions and options
2. **Use double $$ for display equations** when you want centered formulas
3. **Escape special characters** if not using LaTeX: use `\$` for literal dollar sign
4. **Test your questions** using the Test Sheet feature in SheetManager
5. **Keep LaTeX simple** - complex nested formulas may be harder to read on mobile

---

## 🔍 Quick Reference Table

| Symbol | LaTeX | Renders As |
|--------|-------|------------|
| Fraction | `$\frac{a}{b}$` | a/b |
| Square Root | `$\sqrt{x}$` | √x |
| Exponent | `$x^2$` | x² |
| Subscript | `$x_1$` | x₁ |
| Pi | `$\pi$` | π |
| Theta | `$\theta$` | θ |
| Alpha | `$\alpha$` | α |
| Infinity | `$\infty$` | ∞ |
| Plus/Minus | `$\pm$` | ± |
| Multiply | `$\times$` | × |
| Divide | `$\div$` | ÷ |
| Not Equal | `$\neq$` | ≠ |
| Less/Equal | `$\leq$` | ≤ |
| Greater/Equal | `$\geq$` | ≥ |
| Summation | `$\sum$` | Σ |
| Integral | `$\int$` | ∫ |

---

## 📝 Sheet Format Reminder

Your Google Sheets should have these columns:
```
Q No | Question | A | B | C | D | Answer | Explanation
```

**Each column can contain LaTeX!** Just wrap mathematical expressions in `$...$` or `$$...$$`.

---

Need more LaTeX symbols? Check: https://katex.org/docs/supported.html
