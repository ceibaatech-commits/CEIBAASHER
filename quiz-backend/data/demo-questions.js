// Demo questions data - fallback when Google Sheets are not accessible
module.exports = {
  NEET: {
    Physics: [
      {
        id: 'neet_phy_1',
        question: 'A particle moves with constant acceleration. If it travels 24 m in first 4 seconds and 64 m in next 4 seconds, what is its acceleration?',
        options: ['2.5 m/s²', '5 m/s²', '7.5 m/s²', '10 m/s²'],
        correctAnswer: 0,
        explanation: 'Using kinematic equations: s = ut + (1/2)at². For first interval: 24 = 4u + 8a. For next interval: 64 = 4(u+4a) + 8a. Solving these equations gives a = 2.5 m/s²'
      },
      {
        id: 'neet_phy_2',
        question: 'The dimensional formula for angular momentum is:',
        options: ['[ML²T⁻¹]', '[MLT⁻¹]', '[ML²T⁻²]', '[MLT⁻²]'],
        correctAnswer: 0,
        explanation: 'Angular momentum L = Iω, where I has dimensions [ML²] and ω has dimensions [T⁻¹], therefore L = [ML²T⁻¹]'
      },
      {
        id: 'neet_phy_3',
        question: 'A body of mass 2 kg is moving with velocity 10 m/s. The kinetic energy of the body is:',
        options: ['50 J', '100 J', '200 J', '400 J'],
        correctAnswer: 1,
        explanation: 'Kinetic Energy = (1/2)mv² = (1/2) × 2 × 10² = 100 J'
      },
      {
        id: 'neet_phy_4',
        question: 'The escape velocity from Earth is approximately:',
        options: ['7.9 km/s', '11.2 km/s', '15.0 km/s', '20.0 km/s'],
        correctAnswer: 1,
        explanation: 'Escape velocity from Earth is approximately 11.2 km/s, calculated using v = √(2GM/R)'
      },
      {
        id: 'neet_phy_5',
        question: 'Which of the following is a scalar quantity?',
        options: ['Force', 'Velocity', 'Work', 'Acceleration'],
        correctAnswer: 2,
        explanation: 'Work is a scalar quantity as it has only magnitude and no direction. Force, velocity, and acceleration are vector quantities.'
      },
      {
        id: 'neet_phy_6',
        question: 'The SI unit of electric charge is:',
        options: ['Ampere', 'Coulomb', 'Volt', 'Ohm'],
        correctAnswer: 1,
        explanation: 'The SI unit of electric charge is Coulomb (C). Ampere is unit of current, Volt is unit of potential difference, and Ohm is unit of resistance.'
      },
      {
        id: 'neet_phy_7',
        question: 'The speed of light in vacuum is:',
        options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10⁷ m/s', '3 × 10⁹ m/s'],
        correctAnswer: 0,
        explanation: 'The speed of light in vacuum is approximately 3 × 10⁸ m/s or 300,000 km/s'
      },
      {
        id: 'neet_phy_8',
        question: 'Ohm\'s law states that:',
        options: ['V = IR', 'I = VR', 'R = VI', 'V = I/R'],
        correctAnswer: 0,
        explanation: 'Ohm\'s law states that V = IR, where V is voltage, I is current, and R is resistance'
      },
      {
        id: 'neet_phy_9',
        question: 'The unit of power is:',
        options: ['Joule', 'Watt', 'Newton', 'Pascal'],
        correctAnswer: 1,
        explanation: 'The SI unit of power is Watt (W), which equals 1 Joule per second'
      },
      {
        id: 'neet_phy_10',
        question: 'The frequency of visible light is in the range:',
        options: ['10⁹-10¹² Hz', '10¹²-10¹⁵ Hz', '10¹⁴-10¹⁵ Hz', '10¹⁵-10¹⁸ Hz'],
        correctAnswer: 2,
        explanation: 'Visible light has frequencies in the range of approximately 4 × 10¹⁴ Hz to 7.5 × 10¹⁴ Hz'
      },
      {
        id: 'neet_phy_11',
        question: 'Newton\'s second law of motion is:',
        options: ['F = ma', 'F = m/a', 'F = a/m', 'F = m + a'],
        correctAnswer: 0,
        explanation: 'Newton\'s second law states that Force = mass × acceleration (F = ma)'
      },
      {
        id: 'neet_phy_12',
        question: 'The centripetal force is directed:',
        options: ['Tangent to the circle', 'Away from center', 'Towards the center', 'Perpendicular to motion'],
        correctAnswer: 2,
        explanation: 'Centripetal force is always directed towards the center of the circular path'
      },
      {
        id: 'neet_phy_13',
        question: 'The refractive index of water is approximately:',
        options: ['1.0', '1.33', '1.5', '2.4'],
        correctAnswer: 1,
        explanation: 'The refractive index of water is approximately 1.33'
      },
      {
        id: 'neet_phy_14',
        question: 'The acceleration due to gravity on Earth is:',
        options: ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '11.8 m/s²'],
        correctAnswer: 1,
        explanation: 'The acceleration due to gravity on Earth\'s surface is approximately 9.8 m/s²'
      },
      {
        id: 'neet_phy_15',
        question: 'Which law explains the principle of rocket propulsion?',
        options: ['Newton\'s first law', 'Newton\'s second law', 'Newton\'s third law', 'Law of gravitation'],
        correctAnswer: 2,
        explanation: 'Rocket propulsion is based on Newton\'s third law: For every action, there is an equal and opposite reaction'
      }
    ],
    Chemistry: [
      {
        id: 'neet_chem_1',
        question: 'The atomic number of carbon is:',
        options: ['4', '6', '8', '12'],
        correctAnswer: 1,
        explanation: 'Carbon has atomic number 6, meaning it has 6 protons in its nucleus'
      },
      {
        id: 'neet_chem_2',
        question: 'Which of the following is a noble gas?',
        options: ['Oxygen', 'Nitrogen', 'Helium', 'Hydrogen'],
        correctAnswer: 2,
        explanation: 'Helium is a noble gas (Group 18). Noble gases have complete outer electron shells.'
      },
      {
        id: 'neet_chem_3',
        question: 'The pH of pure water at 25°C is:',
        options: ['0', '7', '14', '1'],
        correctAnswer: 1,
        explanation: 'Pure water at 25°C has a pH of 7, which is neutral'
      },
      {
        id: 'neet_chem_4',
        question: 'The valency of oxygen is:',
        options: ['1', '2', '3', '4'],
        correctAnswer: 1,
        explanation: 'Oxygen has a valency of 2, meaning it can form two bonds'
      },
      {
        id: 'neet_chem_5',
        question: 'The molecular formula of glucose is:',
        options: ['C₆H₁₂O₆', 'C₆H₁₀O₆', 'C₅H₁₂O₆', 'C₆H₁₂O₅'],
        correctAnswer: 0,
        explanation: 'Glucose has the molecular formula C₆H₁₂O₆'
      },
      {
        id: 'neet_chem_6',
        question: 'Which element is most abundant in Earth\'s crust?',
        options: ['Iron', 'Silicon', 'Oxygen', 'Carbon'],
        correctAnswer: 2,
        explanation: 'Oxygen is the most abundant element in Earth\'s crust, making up about 46% by mass'
      },
      {
        id: 'neet_chem_7',
        question: 'The process of conversion of solid directly to gas is called:',
        options: ['Melting', 'Sublimation', 'Evaporation', 'Condensation'],
        correctAnswer: 1,
        explanation: 'Sublimation is the process where a solid converts directly to gas without passing through liquid state'
      },
      {
        id: 'neet_chem_8',
        question: 'The hardest natural substance on Earth is:',
        options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
        correctAnswer: 2,
        explanation: 'Diamond is the hardest naturally occurring substance on Earth'
      },
      {
        id: 'neet_chem_9',
        question: 'Avogadro\'s number is approximately:',
        options: ['6.022 × 10²³', '6.022 × 10²²', '6.022 × 10²⁴', '6.022 × 10²¹'],
        correctAnswer: 0,
        explanation: 'Avogadro\'s number is approximately 6.022 × 10²³, representing the number of particles in one mole'
      },
      {
        id: 'neet_chem_10',
        question: 'The symbol for sodium is:',
        options: ['S', 'So', 'Na', 'Sd'],
        correctAnswer: 2,
        explanation: 'The chemical symbol for sodium is Na, derived from its Latin name Natrium'
      },
      {
        id: 'neet_chem_11',
        question: 'An acid tastes:',
        options: ['Sweet', 'Sour', 'Bitter', 'Salty'],
        correctAnswer: 1,
        explanation: 'Acids typically taste sour, though tasting chemicals is dangerous and not recommended'
      },
      {
        id: 'neet_chem_12',
        question: 'The electronic configuration of helium is:',
        options: ['1s¹', '1s²', '2s²', '1s²2s²'],
        correctAnswer: 1,
        explanation: 'Helium has 2 electrons, both in the 1s orbital, giving it the configuration 1s²'
      },
      {
        id: 'neet_chem_13',
        question: 'The most reactive metal is:',
        options: ['Iron', 'Sodium', 'Gold', 'Francium'],
        correctAnswer: 3,
        explanation: 'Francium is the most reactive metal, though it is extremely rare. Among common metals, alkali metals like sodium are highly reactive.'
      },
      {
        id: 'neet_chem_14',
        question: 'The catalyst used in Haber\'s process is:',
        options: ['Platinum', 'Iron', 'Nickel', 'Copper'],
        correctAnswer: 1,
        explanation: 'Iron is used as a catalyst in the Haber process for ammonia synthesis'
      },
      {
        id: 'neet_chem_15',
        question: 'Water has maximum density at:',
        options: ['0°C', '4°C', '25°C', '100°C'],
        correctAnswer: 1,
        explanation: 'Water has its maximum density at 4°C, which is why ice floats on water'
      }
    ],
    Biology: [
      {
        id: 'neet_bio_1',
        question: 'The powerhouse of the cell is:',
        options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'],
        correctAnswer: 1,
        explanation: 'Mitochondria is called the powerhouse of the cell as it produces ATP through cellular respiration'
      },
      {
        id: 'neet_bio_2',
        question: 'DNA stands for:',
        options: ['Deoxyribonucleic Acid', 'Diribonucleic Acid', 'Deoxyribose Acid', 'Diribose Nucleic Acid'],
        correctAnswer: 0,
        explanation: 'DNA stands for Deoxyribonucleic Acid, the molecule that carries genetic information'
      },
      {
        id: 'neet_bio_3',
        question: 'The largest organ in human body is:',
        options: ['Liver', 'Brain', 'Skin', 'Heart'],
        correctAnswer: 2,
        explanation: 'The skin is the largest organ in the human body, covering about 2 square meters'
      },
      {
        id: 'neet_bio_4',
        question: 'Photosynthesis occurs in:',
        options: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'],
        correctAnswer: 1,
        explanation: 'Photosynthesis occurs in chloroplasts, where light energy is converted to chemical energy'
      },
      {
        id: 'neet_bio_5',
        question: 'The normal human body temperature is:',
        options: ['35°C', '36°C', '37°C', '38°C'],
        correctAnswer: 2,
        explanation: 'Normal human body temperature is approximately 37°C (98.6°F)'
      },
      {
        id: 'neet_bio_6',
        question: 'How many chromosomes are present in human cells?',
        options: ['23', '46', '92', '24'],
        correctAnswer: 1,
        explanation: 'Human cells contain 46 chromosomes (23 pairs), except gametes which have 23'
      },
      {
        id: 'neet_bio_7',
        question: 'The functional unit of kidney is:',
        options: ['Neuron', 'Nephron', 'Axon', 'Dendrite'],
        correctAnswer: 1,
        explanation: 'The nephron is the functional unit of the kidney responsible for filtration'
      },
      {
        id: 'neet_bio_8',
        question: 'Which blood group is universal donor?',
        options: ['A', 'B', 'AB', 'O'],
        correctAnswer: 3,
        explanation: 'O negative blood type is the universal donor as it lacks A, B, and Rh antigens'
      },
      {
        id: 'neet_bio_9',
        question: 'The study of plants is called:',
        options: ['Zoology', 'Botany', 'Ecology', 'Mycology'],
        correctAnswer: 1,
        explanation: 'Botany is the scientific study of plants'
      },
      {
        id: 'neet_bio_10',
        question: 'Insulin is produced by:',
        options: ['Liver', 'Pancreas', 'Kidney', 'Heart'],
        correctAnswer: 1,
        explanation: 'Insulin is produced by beta cells in the pancreas and regulates blood sugar levels'
      },
      {
        id: 'neet_bio_11',
        question: 'The longest bone in human body is:',
        options: ['Femur', 'Tibia', 'Humerus', 'Radius'],
        correctAnswer: 0,
        explanation: 'The femur (thigh bone) is the longest and strongest bone in the human body'
      },
      {
        id: 'neet_bio_12',
        question: 'The brain is protected by:',
        options: ['Ribs', 'Skull', 'Spine', 'Sternum'],
        correctAnswer: 1,
        explanation: 'The brain is protected by the skull (cranium)'
      },
      {
        id: 'neet_bio_13',
        question: 'The father of genetics is:',
        options: ['Charles Darwin', 'Gregor Mendel', 'Louis Pasteur', 'Robert Hooke'],
        correctAnswer: 1,
        explanation: 'Gregor Mendel is known as the father of genetics for his work on pea plants'
      },
      {
        id: 'neet_bio_14',
        question: 'Red blood cells are also called:',
        options: ['Leukocytes', 'Erythrocytes', 'Thrombocytes', 'Lymphocytes'],
        correctAnswer: 1,
        explanation: 'Red blood cells are called erythrocytes; they carry oxygen throughout the body'
      },
      {
        id: 'neet_bio_15',
        question: 'The vitamin essential for blood clotting is:',
        options: ['Vitamin A', 'Vitamin C', 'Vitamin K', 'Vitamin D'],
        correctAnswer: 2,
        explanation: 'Vitamin K is essential for blood clotting and bone health'
      }
    ]
  },
  JEE: {
    Physics: [
      {
        id: 'jee_phy_1',
        question: 'A particle moving in a circle of radius r with constant speed v has centripetal acceleration:',
        options: ['v/r', 'v²/r', 'vr', 'v/r²'],
        correctAnswer: 1,
        explanation: 'Centripetal acceleration a = v²/r for uniform circular motion'
      },
      {
        id: 'jee_phy_2',
        question: 'The SI unit of magnetic flux is:',
        options: ['Tesla', 'Weber', 'Henry', 'Gauss'],
        correctAnswer: 1,
        explanation: 'The SI unit of magnetic flux is Weber (Wb). Tesla is the unit of magnetic field.'
      },
      {
        id: 'jee_phy_3',
        question: 'Young\'s modulus is the ratio of:',
        options: ['Stress to strain', 'Strain to stress', 'Force to area', 'Length to area'],
        correctAnswer: 0,
        explanation: 'Young\'s modulus (E) = Stress/Strain, a measure of material stiffness'
      },
      {
        id: 'jee_phy_4',
        question: 'The capacitance of a parallel plate capacitor is:',
        options: ['ε₀A/d', 'ε₀d/A', 'A/ε₀d', 'd/ε₀A'],
        correctAnswer: 0,
        explanation: 'Capacitance C = ε₀A/d where A is area, d is separation, and ε₀ is permittivity'
      },
      {
        id: 'jee_phy_5',
        question: 'The work done by a conservative force in a closed path is:',
        options: ['Maximum', 'Minimum', 'Zero', 'Infinite'],
        correctAnswer: 2,
        explanation: 'Work done by conservative forces in a closed path is always zero'
      },
      {
        id: 'jee_phy_6',
        question: 'The phenomenon of interference is based on:',
        options: ['Particle nature', 'Wave nature', 'Quantum nature', 'Dual nature'],
        correctAnswer: 1,
        explanation: 'Interference is a wave phenomenon demonstrating the wave nature of light'
      },
      {
        id: 'jee_phy_7',
        question: 'The energy of a photon is given by:',
        options: ['hf', 'h/f', 'f/h', 'hf²'],
        correctAnswer: 0,
        explanation: 'Photon energy E = hf where h is Planck\'s constant and f is frequency'
      },
      {
        id: 'jee_phy_8',
        question: 'The coefficient of restitution for a perfectly elastic collision is:',
        options: ['0', '0.5', '1', 'Infinity'],
        correctAnswer: 2,
        explanation: 'For perfectly elastic collision, coefficient of restitution e = 1'
      },
      {
        id: 'jee_phy_9',
        question: 'Lenz\'s law is a consequence of conservation of:',
        options: ['Charge', 'Momentum', 'Energy', 'Mass'],
        correctAnswer: 2,
        explanation: 'Lenz\'s law follows from the law of conservation of energy'
      },
      {
        id: 'jee_phy_10',
        question: 'The radius of gyration of a body depends on:',
        options: ['Mass only', 'Shape only', 'Mass and shape', 'Axis of rotation and mass distribution'],
        correctAnswer: 3,
        explanation: 'Radius of gyration depends on the axis of rotation and how mass is distributed'
      },
      {
        id: 'jee_phy_11',
        question: 'The time period of a simple pendulum is independent of:',
        options: ['Length', 'Mass', 'Gravity', 'Amplitude (for small angles)'],
        correctAnswer: 1,
        explanation: 'Time period T = 2π√(l/g) is independent of the mass of the bob'
      },
      {
        id: 'jee_phy_12',
        question: 'Torque on a current-carrying coil in uniform magnetic field is maximum when:',
        options: ['θ = 0°', 'θ = 45°', 'θ = 90°', 'θ = 180°'],
        correctAnswer: 2,
        explanation: 'Torque τ = NIABsinθ is maximum when θ = 90°'
      },
      {
        id: 'jee_phy_13',
        question: 'The dimensional formula of Planck\'s constant is:',
        options: ['[ML²T⁻¹]', '[ML²T⁻²]', '[MLT⁻¹]', '[ML²T⁻³]'],
        correctAnswer: 0,
        explanation: 'Planck\'s constant h = E/f has dimensions [ML²T⁻¹]'
      },
      {
        id: 'jee_phy_14',
        question: 'The root mean square velocity of gas molecules is proportional to:',
        options: ['√T', 'T', '√(1/T)', '1/T'],
        correctAnswer: 0,
        explanation: 'RMS velocity v_rms = √(3RT/M) ∝ √T'
      },
      {
        id: 'jee_phy_15',
        question: 'A wire of resistance R is stretched to double its length. Its new resistance becomes:',
        options: ['R/2', 'R', '2R', '4R'],
        correctAnswer: 3,
        explanation: 'When length doubles, area becomes half. R\' = ρ(2l)/(A/2) = 4ρl/A = 4R'
      }
    ],
    Chemistry: [
      {
        id: 'jee_chem_1',
        question: 'The oxidation state of Cr in K₂Cr₂O₇ is:',
        options: ['+2', '+4', '+6', '+7'],
        correctAnswer: 2,
        explanation: 'In K₂Cr₂O₇, each Cr has oxidation state +6. 2(+1) + 2x + 7(-2) = 0, solving gives x = +6'
      },
      {
        id: 'jee_chem_2',
        question: 'The hybridization of carbon in methane is:',
        options: ['sp', 'sp²', 'sp³', 'sp³d'],
        correctAnswer: 2,
        explanation: 'In CH₄, carbon undergoes sp³ hybridization forming four equivalent bonds'
      },
      {
        id: 'jee_chem_3',
        question: 'The conjugate base of H₂SO₄ is:',
        options: ['SO₄²⁻', 'HSO₄⁻', 'H₃SO₄⁺', 'H₂SO₃'],
        correctAnswer: 1,
        explanation: 'When H₂SO₄ loses one H⁺, it forms HSO₄⁻ (hydrogen sulfate ion)'
      },
      {
        id: 'jee_chem_4',
        question: 'The shape of SF₆ molecule is:',
        options: ['Tetrahedral', 'Octahedral', 'Square planar', 'Trigonal bipyramidal'],
        correctAnswer: 1,
        explanation: 'SF₆ has octahedral geometry with sp³d² hybridization'
      },
      {
        id: 'jee_chem_5',
        question: 'Which quantum number determines the shape of orbital?',
        options: ['n', 'l', 'm', 's'],
        correctAnswer: 1,
        explanation: 'The azimuthal quantum number (l) determines the shape of the orbital'
      },
      {
        id: 'jee_chem_6',
        question: 'The metal with highest melting point is:',
        options: ['Iron', 'Tungsten', 'Gold', 'Platinum'],
        correctAnswer: 1,
        explanation: 'Tungsten has the highest melting point (3422°C) among all metals'
      },
      {
        id: 'jee_chem_7',
        question: 'Electrophile is a species that:',
        options: ['Donates electrons', 'Accepts electrons', 'Donates protons', 'Accepts protons'],
        correctAnswer: 1,
        explanation: 'Electrophiles are electron-deficient species that accept electrons'
      },
      {
        id: 'jee_chem_8',
        question: 'The IUPAC name of CH₃-CH(CH₃)-CH₃ is:',
        options: ['Butane', 'Propane', '2-Methylpropane', 'Isobutane'],
        correctAnswer: 2,
        explanation: 'The IUPAC name is 2-methylpropane (also known as isobutane)'
      },
      {
        id: 'jee_chem_9',
        question: 'Ziegler-Natta catalyst is used for polymerization of:',
        options: ['Vinyl chloride', 'Ethylene', 'Styrene', 'Propylene'],
        correctAnswer: 1,
        explanation: 'Ziegler-Natta catalyst is primarily used for polymerization of ethylene and propylene'
      },
      {
        id: 'jee_chem_10',
        question: 'The entropy of a perfectly crystalline substance at absolute zero is:',
        options: ['Maximum', 'Minimum', 'Zero', 'Infinity'],
        correctAnswer: 2,
        explanation: 'Third law of thermodynamics: Entropy of perfect crystal at 0 K is zero'
      },
      {
        id: 'jee_chem_11',
        question: 'Which element shows maximum catenation?',
        options: ['Oxygen', 'Nitrogen', 'Carbon', 'Sulfur'],
        correctAnswer: 2,
        explanation: 'Carbon shows maximum catenation due to strong C-C bonds'
      },
      {
        id: 'jee_chem_12',
        question: 'The pH of 0.001 M HCl solution is:',
        options: ['1', '2', '3', '4'],
        correctAnswer: 2,
        explanation: 'pH = -log[H⁺] = -log(0.001) = -log(10⁻³) = 3'
      },
      {
        id: 'jee_chem_13',
        question: 'Fluorine cannot show positive oxidation state because:',
        options: ['It has no d-orbitals', 'It is most electronegative', 'It is smallest halogen', 'All of the above'],
        correctAnswer: 3,
        explanation: 'Fluorine is most electronegative, smallest, and has no d-orbitals for expansion'
      },
      {
        id: 'jee_chem_14',
        question: 'The number of π bonds in benzene is:',
        options: ['3', '6', '9', '12'],
        correctAnswer: 0,
        explanation: 'Benzene has 3 π bonds (delocalized over 6 carbon atoms)'
      },
      {
        id: 'jee_chem_15',
        question: 'Bauxite is an ore of:',
        options: ['Iron', 'Copper', 'Aluminum', 'Zinc'],
        correctAnswer: 2,
        explanation: 'Bauxite (Al₂O₃·2H₂O) is the principal ore of aluminum'
      }
    ],
    Maths: [
      {
        id: 'jee_math_1',
        question: 'The derivative of sin(x) with respect to x is:',
        options: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'],
        correctAnswer: 0,
        explanation: 'd/dx[sin(x)] = cos(x)'
      },
      {
        id: 'jee_math_2',
        question: 'The value of ∫e^x dx is:',
        options: ['e^x', 'e^x + C', 'xe^x', 'e^x/x'],
        correctAnswer: 1,
        explanation: 'The integral of e^x is e^x + C, where C is the constant of integration'
      },
      {
        id: 'jee_math_3',
        question: 'If |A| = 5, then |2A| equals:',
        options: ['5', '10', '20', '40'],
        correctAnswer: 3,
        explanation: 'For a 2×2 matrix, |kA| = k²|A|. So |2A| = 2² × 5 = 20. For 3×3: |2A| = 2³ × 5 = 40'
      },
      {
        id: 'jee_math_4',
        question: 'The sum of first n natural numbers is:',
        options: ['n(n-1)/2', 'n(n+1)/2', 'n²', 'n(n+1)'],
        correctAnswer: 1,
        explanation: 'Sum = 1+2+3+...+n = n(n+1)/2'
      },
      {
        id: 'jee_math_5',
        question: 'The equation of line passing through (0,0) with slope m is:',
        options: ['y = mx', 'y = mx + c', 'x = my', 'y = x/m'],
        correctAnswer: 0,
        explanation: 'Line through origin with slope m is y = mx'
      },
      {
        id: 'jee_math_6',
        question: 'The value of sin²θ + cos²θ is:',
        options: ['0', '1', 'sin(2θ)', 'cos(2θ)'],
        correctAnswer: 1,
        explanation: 'This is a fundamental trigonometric identity: sin²θ + cos²θ = 1'
      },
      {
        id: 'jee_math_7',
        question: 'If log₁₀ 2 = 0.301, then log₁₀ 8 equals:',
        options: ['0.602', '0.903', '2.408', '0.451'],
        correctAnswer: 1,
        explanation: 'log₁₀ 8 = log₁₀ 2³ = 3log₁₀ 2 = 3 × 0.301 = 0.903'
      },
      {
        id: 'jee_math_8',
        question: 'The distance between points (x₁,y₁) and (x₂,y₂) is:',
        options: ['√[(x₂-x₁)² + (y₂-y₁)²]', '(x₂-x₁)² + (y₂-y₁)²', '|x₂-x₁| + |y₂-y₁|', '√(x₂-x₁) + √(y₂-y₁)'],
        correctAnswer: 0,
        explanation: 'Distance formula: d = √[(x₂-x₁)² + (y₂-y₁)²]'
      },
      {
        id: 'jee_math_9',
        question: 'The roots of quadratic equation ax² + bx + c = 0 are given by:',
        options: ['(-b ± √(b²-4ac))/2a', '(-b ± √(b²+4ac))/2a', '(b ± √(b²-4ac))/2a', 'None'],
        correctAnswer: 0,
        explanation: 'Quadratic formula: x = (-b ± √(b²-4ac))/2a'
      },
      {
        id: 'jee_math_10',
        question: 'The area of circle with radius r is:',
        options: ['πr', '2πr', 'πr²', '4πr²'],
        correctAnswer: 2,
        explanation: 'Area of circle = πr²'
      },
      {
        id: 'jee_math_11',
        question: 'The number of diagonals in a polygon with n sides is:',
        options: ['n(n-1)/2', 'n(n-3)/2', 'n(n-2)/2', 'n(n+1)/2'],
        correctAnswer: 1,
        explanation: 'Number of diagonals = n(n-3)/2'
      },
      {
        id: 'jee_math_12',
        question: 'If vectors A and B are perpendicular, then A·B equals:',
        options: ['1', '0', '-1', '|A||B|'],
        correctAnswer: 1,
        explanation: 'For perpendicular vectors, dot product A·B = 0'
      },
      {
        id: 'jee_math_13',
        question: 'The value of lim(x→0) sin(x)/x is:',
        options: ['0', '1', '∞', 'Undefined'],
        correctAnswer: 1,
        explanation: 'This is a standard limit: lim(x→0) sin(x)/x = 1'
      },
      {
        id: 'jee_math_14',
        question: 'The slope of line perpendicular to line with slope m is:',
        options: ['m', '-m', '1/m', '-1/m'],
        correctAnswer: 3,
        explanation: 'For perpendicular lines, m₁ × m₂ = -1, so m₂ = -1/m₁'
      },
      {
        id: 'jee_math_15',
        question: 'The value of i² (where i = √-1) is:',
        options: ['1', '-1', 'i', '-i'],
        correctAnswer: 1,
        explanation: 'By definition, i² = (√-1)² = -1'
      }
    ]
  }
};
