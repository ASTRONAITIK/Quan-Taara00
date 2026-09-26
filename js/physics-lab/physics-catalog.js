/* ━━━━━━━━━━━━ PHYSICS DATA ━━━━━━━━━━━━
   The DATA array (20 disciplines × concepts × equations), the procedural
   "applied catalogue" expansion that pads each discipline out to ~56
   equations, and the discovery TL (timeline) array. Pure data + one small
   render side-effect (disciplineCount/equationCount text). No DOM
   dependency besides those two elements, which exist in the HTML shell.
   Must load before 12-physics-render.js, 13-physics-modal.js,
   16-scene3d.js and 17-equation-search.js, all of which read DATA. */
const DATA=[
{id:1,title:'Classical Mechanics',basic:'Macroscopic motion, forces, energy, and Newtonian laws governing everyday physics.',tags:['Kinematics','Dynamics','Rotation','Gravitation'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Kinematics',desc:'Equations describing motion — linear, projectile, and circular.',eqs:[
    {f:'v = u + at',n:'Velocity-Time Relation',x:'Final velocity after constant acceleration a over time t.',d:'Foundation of uniformly accelerated motion. Derived from definition a = Δv/Δt.'},
    {f:'s = ut + ½at²',n:'Displacement-Time Relation',x:'Distance covered in time t under constant acceleration.',d:'Integrate v=u+at with respect to t.'},
    {f:'v² = u² + 2as',n:'Velocity-Displacement',x:'Links velocity and displacement without time.',d:'Eliminate t from the two equations above.'},
    {f:'R = u² sin2θ / g',n:'Projectile Range',x:'Horizontal distance for launch angle θ.',d:'Maximum at θ=45°. Combine horizontal and vertical motion equations.'},
    {f:'aₒ = v²/r = ω²r',n:'Centripetal Acceleration',x:'Inward acceleration maintaining circular motion.',d:'Derived from geometry of circular motion; direction always toward center.'},
  ]},
  {title:"Newton's Laws & Gravitation",desc:'Forces governing all macroscopic motion.',eqs:[
    {f:'F = ma',n:"Newton's Second Law",x:'Net force equals mass times acceleration.',d:'The central equation of classical dynamics. F, m, a are vectors.'},
    {f:'F = Gm₁m₂/r²',n:"Newton's Law of Gravitation",x:'Attractive force between two masses.',d:'G = 6.674×10⁻¹¹ N m²/kg². Inverse-square law.'},
    {f:'vₒ = √(GM/r)',n:'Orbital Velocity',x:'Speed for circular orbit at radius r.',d:'Set gravitational force equal to centripetal force; solve for v.'},
    {f:'vₑ = √(2GM/R)',n:'Escape Velocity',x:'Minimum speed to escape a body of mass M and radius R.',d:'Set kinetic energy equal to gravitational potential energy.'},
  ]},
]},
{id:2,title:'Thermodynamics',basic:'Heat, work, entropy, and the statistical nature of energy in physical systems.',tags:['Entropy','Carnot','Kinetic Theory'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'The Four Laws',desc:'Pillars governing energy transfer and the arrow of time.',eqs:[
    {f:'ΔQ = ΔU + W',n:'First Law',x:'Heat added equals internal energy change plus work done.',d:'Energy conservation for thermodynamic systems. No perpetual motion machine of the first kind is possible.'},
    {f:'ΔS ≥ 0',n:'Second Law',x:'Total entropy of an isolated system never decreases.',d:'Defines the direction of time. Clausius inequality: ΔS ≥ δQ/T.'},
    {f:'η = 1 − Tₒ/Tₕ',n:'Carnot Efficiency',x:'Maximum efficiency of any heat engine between Tₒ and Tₕ.',d:'Reversible (Carnot) cycle is the theoretical maximum. All real engines are less efficient.'},
  ]},
  {title:'Kinetic Theory',desc:'Statistical mechanics of gas molecules.',eqs:[
    {f:'PV = nRT',n:'Ideal Gas Law',x:'Pressure, volume, temperature relation for ideal gas.',d:'R = 8.314 J mol⁻¹ K⁻¹. Combines Boyle\'s, Charles\'s, and Avogadro\'s laws.'},
    {f:'K̄ = 3/2 kT',n:'Average Kinetic Energy',x:'Mean translational kinetic energy per molecule.',d:'k = 1.38×10⁻²³ J/K. Temperature is a measure of average kinetic energy.'},
    {f:'v_rms = √(3RT/M)',n:'RMS Speed',x:'Root-mean-square molecular speed.',d:'M is molar mass. Used to estimate molecular speeds in Maxwell-Boltzmann distribution.'},
  ]},
]},
{id:3,title:'Electromagnetism',basic:'Electric and magnetic fields unified by Maxwell into a complete theory of light.',tags:['Maxwell','Induction','Waves'],badge:'badge-physics',field:'Physics',concepts:[
  {title:"Maxwell's Equations",desc:'Four laws that unify all classical electromagnetic phenomena.',eqs:[
    {f:'∇·E = ρ/ε₀',n:'Gauss (Electric)',x:'Charges are sources of electric field.',d:'Integral form: ∮E·dA = Q_enc/ε₀. Coulomb\'s law is a consequence.'},
    {f:'∇·B = 0',n:'Gauss (Magnetic)',x:'No magnetic monopoles exist.',d:'Magnetic field lines always form closed loops.'},
    {f:'∇×E = −∂B/∂t',n:"Faraday's Law",x:'Changing magnetic field induces electric field.',d:'Basis of generators and transformers.'},
    {f:'∇×B = μ₀J + μ₀ε₀∂E/∂t',n:'Ampere-Maxwell',x:'Currents and changing E produce magnetic field.',d:'Displacement current term (μ₀ε₀∂E/∂t) predicted electromagnetic waves.'},
    {f:'c = 1/√(μ₀ε₀)',n:'Speed of Light',x:'Derived from Maxwell\'s equations.',d:'c ≈ 3×10⁸ m/s. Maxwell realised light IS an electromagnetic wave.'},
  ]},
]},
{id:4,title:'Special Relativity',basic:'The physics of high velocities — space, time, and mass fundamentally reimagined.',tags:['Lorentz','Spacetime','Mass-Energy'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Core Effects',desc:'Measurable consequences of the two postulates of special relativity.',eqs:[
    {f:'γ = 1/√(1−v²/c²)',n:'Lorentz Factor',x:'The fundamental scaling factor of relativistic effects.',d:'γ→1 as v→0 (classical limit). γ→∞ as v→c (unreachable for massive objects).'},
    {f:'Δt = γΔt₀',n:'Time Dilation',x:'Moving clocks tick slower by factor γ.',d:'Confirmed by muon decay, GPS satellite corrections, atomic clock experiments.'},
    {f:'L = L₀/γ',n:'Length Contraction',x:'Moving objects are shorter along direction of motion.',d:'Only in the direction of motion. Perpendicular dimensions unchanged.'},
    {f:'E = γmc²',n:'Total Energy',x:'Relativistic energy including rest energy.',d:'Rest energy E₀=mc². Kinetic energy K=(γ−1)mc².'},
    {f:'E² = (pc)² + (mc²)²',n:'Energy-Momentum Relation',x:'Invariant combining energy and momentum.',d:'For photons (m=0): E=pc. Fundamental relation in particle physics.'},
  ]},
]},
{id:5,title:'General Relativity',basic:'Gravity as spacetime curvature — Einstein\'s geometric description of gravitation.',tags:['Curvature','Black Holes','Cosmology'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Core Equations',desc:'Geometry curves; matter tells spacetime how to curve; curvature tells matter how to move.',eqs:[
    {f:'Gμν = (8πG/c⁴)Tμν',n:'Einstein Field Equations',x:'Curvature (left) equals matter-energy content (right).',d:'10 coupled nonlinear PDEs. Gμν = Rμν − ½gμνR encodes geometry.'},
    {f:'ds² = (1−2GM/rc²)c²dt² − dr²/(1−2GM/rc²) − r²dΩ²',n:'Schwarzschild Metric',x:'Spacetime geometry outside a spherical mass.',d:'Predicts gravitational time dilation, light bending, black hole event horizon at r_s=2GM/c².'},
    {f:'t = t₀/√(1−2GM/rc²)',n:'Gravitational Time Dilation',x:'Clocks run slower in stronger gravity wells.',d:'GPS clocks gain ~45 μs/day from altitude effect, lose ~7 μs/day from velocity — net +38 μs/day corrected.'},
    {f:'(ȧ/a)² = (8πG/3)ρ − k/a² + Λ/3',n:'Friedmann Equation',x:'Governs the expansion of the universe.',d:'a(t) = cosmic scale factor. k = spatial curvature. Λ = cosmological constant (dark energy).'},
  ]},
]},
{id:6,title:'Quantum Mechanics',basic:'The mathematical framework governing all microscopic physics and atomic structure.',tags:['Wavefunction','Operators','Uncertainty'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Core Formalism',desc:'Hilbert spaces, wavefunctions, and the measurement problem.',eqs:[
    {f:'iℏ ∂ψ/∂t = Ĥψ',n:'Schrödinger Equation',x:'Time evolution of a quantum state.',d:'The quantum analogue of Newton\'s second law. Ĥ is the Hamiltonian operator.'},
    {f:'ΔxΔp ≥ ℏ/2',n:'Uncertainty Principle',x:'Position and momentum cannot both be precisely defined.',d:'Not a measurement limitation — a fundamental property of quantum states (Robertson inequality).'},
    {f:'Eₙ = −13.6/n² eV',n:'Hydrogen Energy Levels',x:'Quantized energy states of hydrogen atom.',d:'n = 1 is ground state. Transitions produce spectral lines (Balmer, Lyman series).'},
    {f:'⟨A⟩ = ⟨ψ|Â|ψ⟩',n:'Expectation Value',x:'Average measurement result for observable A.',d:'Born rule: probability density |ψ|². Physical observables are Hermitian operators.'},
  ]},
]},
{id:7,title:'Stellar Astrophysics',basic:'The physics of stellar interiors, nuclear burning, and the lives of stars.',tags:['Fusion','Structure','Neutron Stars'],badge:'badge-physics',field:'Astrophysics',concepts:[
  {title:'Stellar Structure',desc:'How stars shine and stay in equilibrium for billions of years.',eqs:[
    {f:'dP/dr = −Gρ(r)M(r)/r²',n:'Hydrostatic Equilibrium',x:'Pressure gradient balances gravity throughout the star.',d:'Combined with equation of state and opacity gives the four stellar structure equations.'},
    {f:'L = 4πR²σT⁴',n:'Stefan-Boltzmann Law',x:'Luminosity depends on surface area and temperature.',d:'σ = 5.67×10⁻⁸ W m⁻² K⁻⁴. A small change in T has huge effect on L.'},
    {f:'dP/dr = −G(ρ+P/c²)(M+4πr³P/c²)/[r(r−2GM/c²)]',n:'TOV Equation',x:'GR hydrostatic equilibrium for dense stars.',d:'Determines maximum neutron star mass (~2 M☉). Compact star stability requires GR.'},
  ]},
]},
{id:8,title:'Cosmology',basic:'The origin, evolution, and large-scale structure of the observable universe.',tags:['CMB','Inflation','Dark Energy'],badge:'badge-physics',field:'Astrophysics',concepts:[
  {title:'Universe Evolution',desc:'From the Big Bang to the present large-scale structure.',eqs:[
    {f:'H = ȧ/a',n:'Hubble Parameter',x:'Rate of cosmic expansion at a given time.',d:'H₀ ≈ 67–73 km/s/Mpc (Hubble tension unresolved). Recession velocity: v = H₀d.'},
    {f:'ρ_crit = 3H²/8πG',n:'Critical Density',x:'Density that makes the universe spatially flat.',d:'ρ_crit ≈ 9.5×10⁻²⁷ kg/m³ today. Ω = ρ/ρ_crit defines geometry.'},
    {f:'T ∝ 1/a',n:'CMB Temperature Scaling',x:'Cosmic microwave background cools as universe expands.',d:'T₀ = 2.725 K today. At recombination (z≈1100): T ≈ 3000 K.'},
  ]},
]},
{id:9,title:'Gravitational Wave Astronomy',basic:'Ripples in spacetime detected by LIGO, Virgo, and KAGRA interferometers.',tags:['LIGO','Chirp Mass','Mergers'],badge:'badge-astro',field:'Astrophysics',concepts:[
  {title:'Detection & Source Physics',desc:'How gravitational waves are generated, propagate, and are measured.',eqs:[
    {f:'h = ΔL/L',n:'Gravitational Wave Strain',x:'Fractional change in interferometer arm length.',d:'GW150914: h~10⁻²¹. Arm length L=4 km → ΔL ~ 4×10⁻¹⁸ m. 1000× smaller than a proton.'},
    {f:'ℳ = (m₁m₂)³/⁵/(m₁+m₂)¹/⁵',n:'Chirp Mass',x:'Primary observable controlling GW frequency evolution.',d:'Extracted from the chirp waveform to <1% accuracy. Determines source distance via luminosity.'},
    {f:'P_GW = −32G⁴m₁²m₂²(m₁+m₂)/(5c⁵r⁵)',n:'Peters Formula',x:'Power radiated as gravitational waves from a circular binary.',d:'Causes orbital decay. Confirmed in Hulse-Taylor pulsar (Nobel Prize 1993).'},
  ]},
]},
{id:10,title:'Plasma Physics & MHD',basic:'Ionized gas — the fourth state of matter governing stars, fusion, and space.',tags:['Alfvén','Tokamak','Solar Wind'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Magnetohydrodynamics',desc:'The fluid description of electrically conducting plasmas in magnetic fields.',eqs:[
    {f:'ρ(∂v/∂t + v·∇v) = J×B − ∇P',n:'MHD Momentum Equation',x:'Plasma flow driven by magnetic Lorentz and pressure forces.',d:'J×B: magnetic pressure and tension. Foundation of solar physics, fusion confinement, accretion.'},
    {f:'v_A = B/√(μ₀ρ)',n:'Alfvén Speed',x:'Speed of magnetic wave propagating along field lines.',d:'Solar wind v_A ~ 50 km/s. Pulsar magnetospheres: v_A ~ 0.1c.'},
    {f:'ω_pe = √(ne²/mε₀)',n:'Plasma Frequency',x:'Natural electron oscillation frequency.',d:'EM waves below ω_pe cannot propagate — explains ionospheric radio reflection.'},
  ]},
]},
{id:11,title:'Exoplanet Science',basic:'Detection and characterisation of planets around other stars.',tags:['Transit','Radial Velocity','Habitable Zone'],badge:'badge-astro',field:'Astrophysics',concepts:[
  {title:'Detection Methods',desc:'Techniques that revealed thousands of worlds beyond our solar system.',eqs:[
    {f:'δF/F = (Rₚ/R★)²',n:'Transit Depth',x:'Fractional dip in stellar brightness during transit.',d:'Earth-Sun: δF ≈ 84 ppm. Jupiter-Sun: ≈1%. Kepler measured ppm-level photometry.'},
    {f:'K = (2πG/P)^(1/3) mₚ sini/(m★+mₚ)^(2/3)',n:'RV Semi-Amplitude',x:'Stellar Doppler wobble amplitude due to a planet.',d:'Earth induces K ≈ 0.09 m/s on Sun. First exoplanet (51 Peg b, 1995): K = 56 m/s.'},
  ]},
]},
{id:12,title:'Dark Matter & Dark Energy',basic:'The invisible 95% of the universe that drives cosmic structure and expansion.',tags:['Lambda-CDM','WIMP','Omega'],badge:'badge-astro',field:'Astrophysics',concepts:[
  {title:'Evidence & Models',desc:'What we know about what we cannot see.',eqs:[
    {f:'v(r) = √(GM(<r)/r)',n:'Galaxy Rotation Curves',x:'Flat observed curves vs declining prediction imply dark matter halos.',d:'DM density profile: ρ_DM ∝ 1/r² (isothermal). Observed out to 50+ kpc beyond visible disk.'},
    {f:'ρ_Λ = Λc²/8πG',n:'Dark Energy Density',x:'Vacuum energy density from the cosmological constant.',d:'ρ_Λ ≈ 6×10⁻²⁷ kg/m³ — tiny but dominant at cosmic scales. Drives accelerating expansion.'},
    {f:'Ω_total = Ω_m + Ω_r + Ω_Λ ≈ 1.0',n:'Density Parameters',x:'Flat universe: dark matter 27%, dark energy 68%, baryons 5%.',d:'Measured by CMB power spectrum (Planck 2018). Spatial flatness confirmed to 0.4%.'},
  ]},
]},
{id:13,title:'Radio Astronomy',basic:'Exploring the universe through centimetre-to-kilometre wavelength radiation.',tags:['21cm','Synchrotron','Pulsars'],badge:'badge-astro',field:'Astrophysics',concepts:[
  {title:'Emission Mechanisms',desc:'Physical processes producing radio waves across the cosmos.',eqs:[
    {f:'ν₂₁ = 1420.406 MHz',n:'HI 21-cm Line',x:'Hyperfine spin-flip transition of neutral hydrogen.',d:'Most abundant atom in universe. Maps spiral arm structure, traces cosmic gas. Planned SKA surveys.'},
    {f:'P(ν) ∝ ν^(−α) B^(1+α) N₀',n:'Synchrotron Power Law',x:'Relativistic electrons in B fields produce power-law radio spectra.',d:'Spectral index α ≈ 0.5–1. Seen in supernova remnants, AGN jets, radio galaxies.'},
  ]},
]},
{id:14,title:'Space Weather',basic:'Solar storms and their cascading effects on Earth\'s magnetosphere and technology.',tags:['CME','Solar Wind','Kp Index'],badge:'badge-space',field:'Space Science',concepts:[
  {title:'Solar-Earth Connection',desc:'The electromagnetic link between the Sun and Earth.',eqs:[
    {f:'B²/2μ₀ = ½ρv²',n:'Magnetopause Pressure Balance',x:'Earth\'s field pressure balanced by solar wind ram pressure.',d:'Determines magnetopause standoff distance R_MP ≈ 10 R_Earth at solar minimum.'},
    {f:'Kp = 0–9',n:'Kp Geomagnetic Index',x:'Global activity index from 13 sub-auroral stations.',d:'Kp ≥ 5: geomagnetic storm. Kp 8–9: extreme (G4-G5). Carrington 1859: estimated Kp ~ 9+.'},
  ]},
]},
{id:15,title:'Astrobiology',basic:'The scientific search for life\'s origins, limits, and prevalence in the cosmos.',tags:['Drake Equation','Biosignatures','Habitability'],badge:'badge-bio',field:'Astrobiology',concepts:[
  {title:'Life in the Cosmos',desc:'Quantifying the probability and detectability of life.',eqs:[
    {f:'N = R★·fₚ·nₑ·f_l·fᵢ·f_c·L',n:'Drake Equation',x:'Estimate of communicating civilisations in the Milky Way.',d:'R★≈3/yr, fₚ≈1. f_l, fᵢ, f_c, L are deeply uncertain. N ranges from <1 to millions.'},
    {f:'O₂ + CH₄ → disequilibrium',n:'Biosignature Pair',x:'Chemically reactive gases co-existing require biological replenishment.',d:'These react on ~10-year timescales. Detection by JWST transmission spectroscopy is a priority.'},
  ]},
]},
{id:16,title:'Astrochemistry',basic:'Molecular chemistry in interstellar clouds, disks, and planetary atmospheres.',tags:['ISM','Molecules','Dust'],badge:'badge-space',field:'Space Science',concepts:[
  {title:'Interstellar Chemistry',desc:'How complex molecules form in the cold, dark interstellar medium.',eqs:[
    {f:'dNᵢ/dt = Σⱼₖ αⱼₖnⱼnₖ − Nᵢ Σⱼ βᵢⱼnⱼ',n:'ISM Rate Equations',x:'Formation minus destruction rates for chemical species i.',d:'230+ molecules detected in ISM. Grain-surface chemistry dominates in cold dense clouds (T~10K).'},
    {f:'τ = N_H/(σ_pe G₀)',n:'Photodissociation Timescale',x:'UV destroys molecules at cloud edges illuminated by hot stars.',d:'PDR (Photodissociation Region) chemistry: rich surface, protected interior. Self-shielding of H₂ and CO.'},
  ]},
]},
{id:17,title:'Fluid Dynamics',basic:'The motion of liquids and gases, from atmospheric vortices to accretion disks.',tags:['Navier-Stokes','Vortices','Turbulence'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Flow and Pressure',desc:'Continuum equations that describe how fluids move and exchange energy.',eqs:[
    {f:'∂ρ/∂t + ∇·(ρv) = 0',n:'Continuity Equation',x:'Mass is conserved as fluid flows through space.',d:'For an incompressible fluid, this reduces to ∇·v = 0. It is the starting point for every flow field.'},
    {f:'ρ(∂v/∂t + v·∇v) = −∇p + μ∇²v + f',n:'Navier-Stokes Equation',x:'Momentum balance for a viscous fluid.',d:'The nonlinear advection term v·∇v is responsible for much of the richness of turbulence.'},
    {f:'Re = ρvL/μ',n:'Reynolds Number',x:'Ratio of inertial to viscous forces.',d:'Low Re flows are smooth and laminar; high Re flows tend toward chaotic turbulence.'},
    {f:'∂v/∂t + (v·∇)v = −∇Φ',n:'Euler Flow',x:'Ideal, inviscid fluid motion under a potential force.',d:'Set viscosity to zero in Navier-Stokes. This approximation is useful for large-scale astrophysical flows.'},
  ]},
]},
{id:18,title:'Optics & Photonics',basic:'Light as a wave, a ray, and a quantum of the electromagnetic field.',tags:['Interference','Lenses','Photons'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Light and Vision',desc:'The equations behind imaging, colour, diffraction, and optical instruments.',eqs:[
    {f:'n₁ sinθ₁ = n₂ sinθ₂',n:"Snell's Law",x:'Refraction at the boundary between two transparent media.',d:'Light bends because its phase velocity changes between media. Total internal reflection follows when θ exceeds the critical angle.'},
    {f:'1/f = 1/u + 1/v',n:'Thin Lens Equation',x:'Relates focal length to object and image distances.',d:'The sign convention identifies real and virtual images. Magnification is m = −v/u.'},
    {f:'d sinθ = mλ',n:'Diffraction Grating',x:'Bright interference maxima from a periodic array of slits.',d:'Higher orders and smaller wavelengths spread farther from the central maximum.'},
    {f:'E = hν = hc/λ',n:'Photon Energy',x:'Energy carried by one quantum of electromagnetic radiation.',d:'Shorter-wavelength photons carry more energy. This links spectroscopy to atomic structure.'},
  ]},
]},
{id:19,title:'Particle Physics',basic:'The fields, symmetries, and collisions that build the Standard Model.',tags:['Quarks','Gauge Fields','Collider'],badge:'badge-space',field:'Frontier Physics',concepts:[
  {title:'The Standard Model',desc:'A compact map of the particles and interactions visible to modern detectors.',eqs:[
    {f:'E² = p²c² + m²c⁴',n:'Relativistic Dispersion',x:'Energy, momentum, and rest mass for any particle.',d:'For a massless particle E = pc. For a particle at rest p = 0, the relation becomes E = mc².'},
    {f:'L = −¼Fᵃ_μνFᵃ^μν + ψ̄(iγᵘDᵤ − m)ψ',n:'Gauge Field Lagrangian',x:'A compact expression for fields, matter, and their coupling.',d:'The Lagrangian encodes the Standard Model symmetries and produces equations of motion through the action principle.'},
    {f:'σ = N/(L·ε)',n:'Collider Cross-Section',x:'Converts detected event counts into an interaction probability.',d:'N is the background-subtracted event yield, L the integrated luminosity, and ε the total detection efficiency.'},
    {f:'α = e²/(4πε₀ℏc) ≈ 1/137',n:'Fine-Structure Constant',x:'Dimensionless strength of electromagnetic interactions.',d:'Its small value makes perturbative quantum electrodynamics extraordinarily accurate.'},
  ]},
]},
{id:20,title:'Mathematical Physics',basic:'The structures and symmetries that let physics turn intuition into prediction.',tags:['Lagrangian','Fourier','Symmetry'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Principles and Transforms',desc:'Reusable mathematical languages shared by mechanics, waves, and fields.',eqs:[
    {f:'δS = 0',n:'Principle of Stationary Action',x:'Physical paths make the action stationary under small variations.',d:'With S = ∫L dt, this produces the Euler-Lagrange equations and unifies many areas of physics.'},
    {f:'d/dt(∂L/∂q̇) − ∂L/∂q = 0',n:'Euler-Lagrange Equation',x:'The equation of motion for a generalized coordinate q.',d:'Choose a Lagrangian L = T − V and the correct coordinates; the resulting equation respects constraints naturally.'},
    {f:'F(k) = ∫ f(x)e^(−ikx) dx',n:'Fourier Transform',x:'Decomposes a signal into its spatial or temporal frequencies.',d:'The same wave can be understood as a localized pulse in x or a spectrum in k. Both descriptions are equivalent.'},
    {f:'[A,B] = AB − BA',n:'Commutator',x:'Measures whether two operations can be performed in either order.',d:'Non-zero commutators are the algebraic heart of quantum uncertainty and angular momentum.'},
  ]},
]},
];

/* Expand the hand-curated core into a searchable applied atlas. These are
   parameterised worked cases, not blank placeholders: every entry carries a
   domain, a concrete formula, a use case, and an explanation. */
const EQUATION_EXPANSION_SETS={
  mechanics:{
    concept:'Applied Mechanics Lab',
    desc:'Worked motion, force, momentum, and energy cases with changing physical parameters.',
    families:[
      {sim:'motion',make:i=>{const u=2+(i%10)*2,a=.5+(i%8)*.5,t=1+(i%6);return {f:`v = ${u} + (${a})t`,n:`Constant Acceleration Case ${i+1}`,x:`A body starts at ${u} m/s and accelerates at ${a} m/s² for ${t} s.`,d:`Use v = u + at. Substituting u=${u} m/s, a=${a} m/s², and t=${t} s gives the final velocity. The same relationship powers the live motion simulation.`};}},
      {sim:'motion',make:i=>{const u=1+(i%7),a=1+(i%5),t=2+(i%7);return {f:`s = (${u})t + ½(${a})t²`,n:`Displacement Case ${i+1}`,x:`Find displacement after ${t} s from u=${u} m/s with a=${a} m/s².`,d:`The first term is the distance carried by the initial velocity; the second is the extra distance accumulated through acceleration.`};}},
      {sim:'force',make:i=>{const m=2+(i%9)*2,a=1+(i%6);return {f:`F = (${m} kg)(${a} m/s²)`,n:`Net Force Case ${i+1}`,x:`A ${m} kg body accelerates at ${a} m/s².`,d:`Newton's second law converts the motion into a net force: F = ma. The simulation draws the force arrow and the resulting acceleration.`};}},
      {sim:'orbit',make:i=>{const m=1+(i%8),v=3+(i%9);return {f:`p = (${m} kg)(${v} m/s)`,n:`Momentum Case ${i+1}`,x:`Linear momentum for mass ${m} kg moving at ${v} m/s.`,d:`Momentum is mass multiplied by velocity. It is conserved when the net external impulse on a system is zero.`};}}
    ]
  },
  thermo:{
    concept:'Applied Thermodynamics Lab',
    desc:'Concrete thermal, gas, entropy, and efficiency cases for intuition and calculation.',
    families:[
      {sim:'gas',make:i=>{const n=1+(i%4),T=250+(i%8)*50,V=10+(i%6)*5;return {f:`P = (${n})R(${T})/(${V})`,n:`Ideal Gas Case ${i+1}`,x:`Pressure for ${n} mol at ${T} K in ${V} L.`,d:`The ideal gas law links microscopic thermal motion to macroscopic pressure. Increasing T or n raises P; increasing V lowers it.`};}},
      {sim:'thermo',make:i=>{const m=1+(i%6),c=420+(i%5)*80,dT=10+(i%7)*10;return {f:`Q = (${m})(${c})(${dT})`,n:`Heating Case ${i+1}`,x:`Heat ${m} kg with specific heat ${c} J/(kg K) through ${dT} K.`,d:`Q = mcΔT counts the energy stored as random microscopic motion. The simulation shows particles moving faster as temperature rises.`};}},
      {sim:'thermo',make:i=>{const Th=500+(i%7)*100,Tc=200+(i%5)*40;return {f:`η = 1 − ${Tc}/${Th}`,n:`Carnot Engine Case ${i+1}`,x:`Ideal efficiency between ${Th} K and ${Tc} K reservoirs.`,d:`Carnot efficiency is a thermodynamic ceiling. No heat engine between these temperatures can exceed it.`};}},
      {sim:'thermo',make:i=>{const Q=100+(i%8)*50,T=250+(i%6)*50;return {f:`ΔS = ${Q}/${T}`,n:`Entropy Transfer Case ${i+1}`,x:`Reversible heat transfer of ${Q} J at ${T} K.`,d:`For reversible transfer, entropy change is heat divided by absolute temperature. Entropy tracks energy dispersal, not simply energy amount.`};}}
    ]
  },
  electromagnetism:{
    concept:'Applied Electromagnetism Lab',
    desc:'Field, circuit, power, and wave cases showing how electromagnetic quantities respond.',
    families:[
      {sim:'field',make:i=>{const q1=2+(i%6),q2=1+(i%5),r=1+(i%7);return {f:`F = k(${q1} μC)(${q2} μC)/(${r} m)²`,n:`Coulomb Field Case ${i+1}`,x:`Electrostatic force between charges ${q1} μC and ${q2} μC separated by ${r} m.`,d:`The inverse-square law makes nearby charges dominate. Field arrows in the simulation grow denser and brighter near the source.`};}},
      {sim:'circuit',make:i=>{const R=2+(i%8),I=1+(i%6);return {f:`V = (${I} A)(${R} Ω)`,n:`Ohmic Circuit Case ${i+1}`,x:`Voltage across a ${R} Ω resistor carrying ${I} A.`,d:`Ohm's law describes a linear resistor. The live circuit view couples current, voltage, and dissipated power.`};}},
      {sim:'circuit',make:i=>{const V=5+(i%8)*5,I=1+(i%5);return {f:`P = (${V} V)(${I} A)`,n:`Electrical Power Case ${i+1}`,x:`Power delivered at ${V} V and ${I} A.`,d:`P = VI measures the rate at which electrical energy is transferred. It is also I²R or V²/R for a resistor.`};}},
      {sim:'wave',make:i=>{const lambda=.25+(i%8)*.25,f=2+(i%7);return {f:`c = (${lambda} m)(${f} Hz)`,n:`Wave Speed Case ${i+1}`,x:`A wave with wavelength ${lambda} m and frequency ${f} Hz.`,d:`Wave speed is wavelength multiplied by frequency. The animated crest spacing and oscillation rate update together.`};}}
    ]
  },
  relativity:{
    concept:'Applied Relativity Lab',
    desc:'Visual cases for time, length, energy, and momentum at high speed.',
    families:[
      {sim:'relativity',make:i=>{const beta=.1+(i%8)*.1;return {f:`γ = 1/√(1−${beta}²)`,n:`Lorentz Factor Case ${i+1}`,x:`Time and length effects at v = ${beta}c.`,d:`The Lorentz factor grows nonlinearly as velocity approaches c. The simulation shows a clock slowing and a moving rod contracting.`};}},
      {sim:'relativity',make:i=>{const m=.5+(i%8)*.5;return {f:`E = (${m} kg)c²`,n:`Mass-Energy Case ${i+1}`,x:`Rest energy equivalent of ${m} kg of mass.`,d:`Mass and energy are two descriptions of the same conserved quantity. The scene converts a compact mass core into an expanding energy field.`};}},
      {sim:'relativity',make:i=>{const m=1+(i%7),beta=.1+(i%7)*.1;return {f:`p = γ(${m} kg)(${beta}c)`,n:`Relativistic Momentum Case ${i+1}`,x:`Momentum of a ${m} kg object at ${beta}c.`,d:`Unlike classical momentum, relativistic momentum keeps increasing sharply near the speed limit.`};}},
      {sim:'relativity',make:i=>{const t=1+(i%8);return {f:`Δt = γ(${t} s)`,n:`Time Dilation Case ${i+1}`,x:`A proper time interval of ${t} s measured by a moving clock.`,d:`An observer moving relative to the clock measures a longer interval. The result is not a visual illusion; it is a spacetime measurement.`};}}
    ]
  },
  quantum:{
    concept:'Applied Quantum Lab',
    desc:'Wave, photon, uncertainty, and bound-state cases with visual probability dynamics.',
    families:[
      {sim:'quantum',make:i=>{const f=4+(i%8),h=6.626e-34;return {f:`E = h(${f} × 10¹⁴ Hz)`,n:`Photon Energy Case ${i+1}`,x:`Energy of light at frequency ${f} × 10¹⁴ Hz.`,d:`Photon energy is proportional to frequency. The simulation shows discrete packets arriving at a detector rather than a continuous classical stream.`};}},
      {sim:'quantum',make:i=>{const p=1+(i%8);return {f:`λ = h/(${p} × 10⁻²⁴ kg m/s)`,n:`Matter Wave Case ${i+1}`,x:`de Broglie wavelength for momentum ${p} × 10⁻²⁴ kg m/s.`,d:`Every moving object has a matter wavelength, but it becomes visible only when the momentum is small enough.`};}},
      {sim:'quantum',make:i=>{const dx=.2+(i%8)*.2;return {f:`Δp ≥ ℏ/(2 × ${dx} nm)`,n:`Uncertainty Case ${i+1}`,x:`Minimum momentum spread when position spread is ${dx} nm.`,d:`Sharper localisation requires a wider momentum distribution. The wave packet visibly narrows and broadens in the simulation.`};}},
      {sim:'quantum',make:i=>{const n=1+(i%7);return {f:`Eₙ = −13.6/${n}² eV`,n:`Hydrogen Level Case ${i+1}`,x:`Bound-state energy for principal quantum number n=${n}.`,d:`Allowed atomic energies are discrete. Transitions happen when a photon supplies exactly the gap between two levels.`};}}
    ]
  },
  gravity:{
    concept:'Applied Gravity & Cosmology Lab',
    desc:'Orbital, escape, expansion, and density cases across planetary and cosmic scales.',
    families:[
      {sim:'orbit',make:i=>{const M=1+(i%8),r=1+(i%7);return {f:`F = G(${M} M☉)m/(${r} AU)²`,n:`Gravity Field Case ${i+1}`,x:`Gravitational pull at ${r} AU from a ${M} solar-mass body.`,d:`Gravity weakens with the square of distance. The orbit simulation turns this gradient into curved trajectories.`};}},
      {sim:'orbit',make:i=>{const M=1+(i%9),r=1+(i%8);return {f:`v = √(G(${M} M☉)/(${r} AU))`,n:`Orbital Velocity Case ${i+1}`,x:`Circular speed at ${r} AU around ${M} solar masses.`,d:`Circular orbit speed falls with radius and rises with central mass. The moving body continuously falls while missing the central object.`};}},
      {sim:'expanding',make:i=>{const H=65+(i%8)*2,d=10+(i%7)*10;return {f:`v = (${H} km/s/Mpc)(${d} Mpc)`,n:`Hubble Flow Case ${i+1}`,x:`Recession speed at ${d} Mpc for H₀=${H} km/s/Mpc.`,d:`On very large scales, space itself expands and carries distant galaxies apart. The expanding grid visualises the scale factor.`};}},
      {sim:'expanding',make:i=>{const H=60+(i%7)*3;return {f:`ρc = 3(${H})²/(8πG)`,n:`Critical Density Case ${i+1}`,x:`Density threshold for H₀=${H} km/s/Mpc.`,d:`Critical density separates open, flat, and closed expansion in simple cosmological models.`};}}
    ]
  },
  stellar:{
    concept:'Applied Stellar Physics Lab',
    desc:'Radiation, spectra, stellar lifetimes, and compact-object cases.',
    families:[
      {sim:'star',make:i=>{const R=1+(i%7)*.5,T=3000+(i%8)*1000;return {f:`L = 4π(${R}R☉)²σ(${T}K)⁴`,n:`Stellar Luminosity Case ${i+1}`,x:`Luminosity for radius ${R} R☉ and surface temperature ${T} K.`,d:`A star can be bright because it is large, hot, or both. The star simulation maps temperature to colour and radius to area.`};}},
      {sim:'star',make:i=>{const L=1+(i%8),d=1+(i%7)*2;return {f:`F = (${L}L☉)/(4π(${d} pc)²)`,n:`Inverse-Square Brightness Case ${i+1}`,x:`Observed flux from luminosity ${L} L☉ at ${d} pc.`,d:`The same luminosity looks dimmer as it spreads over larger spherical shells. This is why distance must be calibrated in astronomy.`};}},
      {sim:'star',make:i=>{const T=3000+(i%8)*1000;return {f:`λmax = 2.898×10⁻³/${T}`,n:`Wien Peak Case ${i+1}`,x:`Peak wavelength for a ${T} K blackbody.`,d:`Hotter surfaces peak at shorter, bluer wavelengths; cooler surfaces peak at longer, redder wavelengths.`};}},
      {sim:'star',make:i=>{const M=.5+(i%8)*.5;return {f:`tMS ≈ 10¹⁰(${M})⁻²⋅⁵ yr`,n:`Main-Sequence Lifetime Case ${i+1}`,x:`Approximate lifetime for a ${M} M☉ star.`,d:`Massive stars burn fuel rapidly and die young; low-mass stars trade brilliance for longevity.`};}}
    ]
  },
  waves:{
    concept:'Applied Waves & Optics Lab',
    desc:'Interference, refraction, diffraction, and oscillation cases.',
    families:[
      {sim:'optics',make:i=>{const n1=1,n2=1.2+(i%6)*.1;return {f:`sin θ₂ = (${n1}/${n2}) sin θ₁`,n:`Refraction Case ${i+1}`,x:`Light enters a medium with refractive index ${n2}.`,d:`Snell's law follows from matching the wave phase along a boundary. The ray simulation bends while conserving frequency.`};}},
      {sim:'optics',make:i=>{const d=.5+(i%7)*.5,m=1+(i%4),lambda=.4+(i%6)*.1;return {f:`sin θ = (${m}×${lambda})/${d}`,n:`Diffraction Grating Case ${i+1}`,x:`Order ${m} maximum for spacing ${d} μm and wavelength ${lambda} μm.`,d:`Periodic slits interfere constructively only at selected angles. Higher orders separate colours more strongly.`};}},
      {sim:'wave',make:i=>{const A=.5+(i%6)*.25,f=1+(i%8);return {f:`y = (${A}) sin(2π(${f})t)`,n:`Oscillator Case ${i+1}`,x:`Amplitude ${A} and frequency ${f} Hz.`,d:`Amplitude controls the size of the displacement; frequency controls how quickly the cycle repeats.`};}},
      {sim:'wave',make:i=>{const A=1+(i%5),I=A*A;return {f:`I ∝ (${A})² = ${I}`,n:`Wave Intensity Case ${i+1}`,x:`Relative intensity for amplitude ${A}.`,d:`Wave intensity scales with amplitude squared, so doubling amplitude quadruples transported energy.`};}}
    ]
  },
  plasma:{
    concept:'Applied Plasma & Fluid Lab',
    desc:'Flow, magnetic pressure, waves, and transport cases in conducting fluids.',
    families:[
      {sim:'fluid',make:i=>{const rho=1+(i%6),v=2+(i%7),L=1+(i%5),mu=.5+(i%4)*.25;return {f:`Re = (${rho})(${v})(${L})/${mu}`,n:`Reynolds Flow Case ${i+1}`,x:`Flow with ρ=${rho}, v=${v}, L=${L}, and μ=${mu} in consistent units.`,d:`Reynolds number compares inertial and viscous effects. Low values make smooth streamlines; high values invite eddies.`};}},
      {sim:'field',make:i=>{const B=.01+(i%7)*.01,rho=1+(i%5);return {f:`vA = ${B}/√(μ₀(${rho}))`,n:`Alfvén Wave Case ${i+1}`,x:`Magnetic wave for field ${B} T and density scale ${rho}.`,d:`Magnetic tension acts like an elastic restoring force. The field-line simulation carries a transverse pulse.`};}},
      {sim:'fluid',make:i=>{const v=2+(i%7),rho=1+(i%6);return {f:`q = ½(${rho})(${v})²`,n:`Dynamic Pressure Case ${i+1}`,x:`Flow pressure for density ${rho} and speed ${v}.`,d:`Moving fluid carries kinetic pressure. It rises quadratically with speed, which is why fast winds are powerful.`};}},
      {sim:'fluid',make:i=>{const area=1+(i%5),v=2+(i%6);return {f:`Q = (${area})(${v})`,n:`Continuity Flow Case ${i+1}`,x:`Volume flow through area ${area} at speed ${v}.`,d:`For incompressible flow, the same volume rate must cross every section: narrowing a pipe increases speed.`};}}
    ]
  }
};
const EQUATION_EXPANSION_KEY={1:'mechanics',2:'thermo',3:'electromagnetism',4:'relativity',5:'relativity',6:'quantum',7:'stellar',8:'gravity',9:'gravity',10:'plasma',11:'stellar',12:'gravity',13:'waves',14:'plasma',15:'stellar',16:'plasma',17:'plasma',18:'waves',19:'quantum',20:'quantum'};
function expandEquationCatalogue(){
  DATA.forEach(d=>{
    const set=EQUATION_EXPANSION_SETS[EQUATION_EXPANSION_KEY[d.id]]||EQUATION_EXPANSION_SETS.mechanics;
    if(!set||d.concepts.some(c=>c.title===set.concept))return;
    const current=d.concepts.reduce((sum,c)=>sum+c.eqs.length,0);
    const need=Math.max(56-current,0),eqs=[];
    for(let i=0;i<need;i++){
      const family=set.families[i%set.families.length];
      const generated=family.make(i);
      eqs.push({...generated,source:'applied-catalogue',sim:family.sim||generated.sim||'cosmic'});
    }
    d.concepts.push({title:set.concept,desc:set.desc,eqs});
  });
}
expandEquationCatalogue();
const equationTotal=()=>DATA.reduce((sum,d)=>sum+d.concepts.reduce((n,c)=>n+c.eqs.length,0),0);
document.getElementById('disciplineCount').textContent=DATA.length;
document.getElementById('equationCount').textContent=equationTotal().toLocaleString()+'+';

const TL=[
  {yr:'1687',t:'Classical Mechanics',d:'Newton\'s Principia unifies terrestrial and celestial motion under universal gravitation.'},
  {yr:'1865',t:'Electromagnetism',d:'Maxwell unifies electricity, magnetism, and optics — predicting electromagnetic waves.'},
  {yr:'1905',t:'Special Relativity',d:'Einstein\'s miracle year: E=mc² and the end of absolute space and time.'},
  {yr:'1915',t:'General Relativity',d:'Gravity becomes geometry — spacetime curvature replaces Newton\'s force.'},
  {yr:'1925',t:'Quantum Mechanics',d:'Heisenberg, Schrödinger, and Dirac complete the quantum framework.'},
  {yr:'1929',t:'Expanding Universe',d:'Hubble discovers galaxies recede proportional to distance — the universe had a beginning.'},
  {yr:'1965',t:'CMB Discovery',d:'Penzias & Wilson detect the cosmic microwave background, relic of the Big Bang.'},
  {yr:'1995',t:'First Exoplanet',d:'Mayor & Queloz discover 51 Peg b — a giant planet orbiting a Sun-like star (Nobel 2019).'},
  {yr:'1998',t:'Accelerating Universe',d:'Type Ia supernovae reveal dark energy driving cosmic acceleration (Nobel 2011).'},
  {yr:'2016',t:'Gravitational Waves',d:'LIGO detects GW150914 — two merging black holes 1.3 billion light-years away.'},
  {yr:'2019',t:'Black Hole Image',d:'Event Horizon Telescope images M87* — first direct photograph of a black hole shadow.'},
  {yr:'2022',t:'JWST First Light',d:'James Webb images galaxies less than 300 million years after the Big Bang.'},
];