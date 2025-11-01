import React from 'react';
import MathText from '../components/MathText';

const TestLatex = () => {
  const testCases = [
    {
      title: "Simple Inline Math",
      text: "The value of $x^2$ when $x=3$ is $9$"
    },
    {
      title: "Display Equation (Double Dollar)",
      text: "The quadratic formula is: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$"
    },
    {
      title: "Complex Number",
      text: "If $z = -2 + 2\\sqrt{3}i$, then $|z| = \\sqrt{(-2)^2 + (2\\sqrt{3})^2} = 4$"
    },
    {
      title: "Fractions and Exponents",
      text: "$$\\frac{a^2 + b^2}{c^2} = \\frac{x}{y}$$"
    },
    {
      title: "Trigonometry",
      text: "We know that $\\sin^2(\\theta) + \\cos^2(\\theta) = 1$"
    },
    {
      title: "Greek Letters",
      text: "The angles are $\\alpha = 30°$, $\\beta = 60°$, and $\\gamma = 90°$"
    },
    {
      title: "Integration",
      text: "The integral is: $$\\int_0^1 x^2 dx = \\frac{1}{3}$$"
    },
    {
      title: "Matrix",
      text: "$$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$$"
    },
    {
      title: "Unicode: Chemical Bonds (σ-π)",
      text: "The σ-π bond in benzene is delocalized. The σ bond is stronger than π bond."
    },
    {
      title: "Unicode: Chemical Structure",
      text: "The compound R-CH(OH)-CH₃ undergoes oxidation to form R-CO-CH₃"
    },
    {
      title: "Unicode: Logarithm with Subscripts",
      text: "The rate constant relationship is: log(k/k₀) = -Ea/2.303RT where k₀ is initial rate"
    },
    {
      title: "Unicode: Chemical Formula",
      text: "Benzene C₆H₆ has alternating σ and π bonds. The π electron cloud is above and below the ring."
    },
    {
      title: "Unicode: Greek + Subscripts",
      text: "The wavelength λ₀ = 589 nm, frequency ν₀ = 5.09×10¹⁴ Hz, energy ΔE = hν"
    },
    {
      title: "WITHOUT Dollar Signs (Broken)",
      text: "If z = -2 + 2√3i then |z| = 4"
    },
    {
      title: "Your Sheet Format (Broken)",
      text: "If z=2+3i and w=1-2i then zw is?"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KaTeX Test Page</h1>
          <p className="text-gray-600">Testing LaTeX math rendering with KaTeX</p>
        </div>

        <div className="space-y-4">
          {testCases.map((test, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-blue-600 mb-2">{test.title}</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-2">
                <p className="text-xs text-gray-500 mb-1">Raw text:</p>
                <code className="text-xs text-gray-700">{test.text}</code>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-gray-500 mb-1">Rendered:</p>
                <div className="text-lg">
                  <MathText text={test.text} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mt-8">
          <h3 className="text-xl font-bold text-yellow-900 mb-3">🔑 Key Takeaway</h3>
          <ul className="space-y-2 text-yellow-900">
            <li>✅ LaTeX WITH dollar signs: <code>$x^2$</code> → Renders beautifully</li>
            <li>❌ Text WITHOUT dollar signs: <code>x^2</code> → Shows as plain text</li>
            <li>📝 Your Google Sheet needs $ signs added around all math expressions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestLatex;
