const shortText = (v = '', max = 24) => (v.length > max ? `${v.slice(0, max - 1)}.` : v);

const get3DAssetPath = (muscle = '') => {
  const m = muscle.toLowerCase();
  if (m.includes('chest')) return '/workouts-3d/chest.png';
  if (m.includes('triceps')) return '/workouts-3d/triceps.png';
  if (m.includes('biceps')) return '/workouts-3d/biceps.png';
  if (m.includes('forearm')) return '/workouts-3d/forearms.png';
  if (m.includes('delt') || m.includes('shoulder')) return '/workouts-3d/shoulders.png';
  if (m.includes('lat') || m.includes('back') || m.includes('trap')) return '/workouts-3d/back.png';
  if (m.includes('abs') || m.includes('core') || m.includes('oblique')) return '/workouts-3d/core.png';
  if (m.includes('quad')) return '/workouts-3d/quads.png';
  if (m.includes('hamstring')) return '/workouts-3d/hamstrings.png';
  if (m.includes('glute')) return '/workouts-3d/glutes.png';
  if (m.includes('calf')) return '/workouts-3d/calves.png';
  return '/workouts-3d/general.png';
};

const getView = (muscle = '', preferredView = 'auto') => {
  if (preferredView === 'front' || preferredView === 'back') return preferredView;
  const m = muscle.toLowerCase();
  if (m.includes('back') || m.includes('lat') || m.includes('rear') || m.includes('trap') || m.includes('hamstring')) return 'back';
  return 'front';
};

const activationShapes = (muscle = '', view = 'front', pulse = 1) => {
  const m = muscle.toLowerCase();
  const high = (0.65 + 0.28 * pulse).toFixed(2);
  const mid = (0.55 + 0.25 * pulse).toFixed(2);
  const red = `fill='#ff4141' fill-opacity='${high}'`;
  const deep = `fill='#d41111' fill-opacity='${mid}'`;

  if (m.includes('chest')) return [`<ellipse cx='144' cy='126' rx='19' ry='15' ${red}/>`, `<ellipse cx='176' cy='126' rx='19' ry='15' ${red}/>`, `<ellipse cx='160' cy='129' rx='6' ry='8' ${deep}/>`, `<ellipse cx='160' cy='141' rx='11' ry='6' ${deep}/>`];
  if (m.includes('triceps')) return [`<ellipse cx='118' cy='148' rx='8' ry='20' ${red}/>`, `<ellipse cx='202' cy='148' rx='8' ry='20' ${red}/>`];
  if (m.includes('biceps')) return [`<ellipse cx='118' cy='137' rx='10' ry='18' ${red}/>`, `<ellipse cx='202' cy='137' rx='10' ry='18' ${red}/>`, `<ellipse cx='118' cy='149' rx='7' ry='10' ${deep}/>`, `<ellipse cx='202' cy='149' rx='7' ry='10' ${deep}/>`];
  if (m.includes('delt') || m.includes('shoulder')) return [`<circle cx='116' cy='118' r='13' ${red}/>`, `<circle cx='204' cy='118' r='13' ${red}/>`, `<circle cx='116' cy='118' r='7' ${deep}/>`, `<circle cx='204' cy='118' r='7' ${deep}/>`];
  if (m.includes('lat') || m.includes('back')) return view === 'back'
    ? [`<ellipse cx='130' cy='150' rx='16' ry='32' ${red}/>`, `<ellipse cx='190' cy='150' rx='16' ry='32' ${red}/>`, `<rect x='152' y='146' width='16' height='30' rx='7' ${deep}/>`]
    : [`<ellipse cx='130' cy='151' rx='12' ry='26' ${red}/>`, `<ellipse cx='190' cy='151' rx='12' ry='26' ${red}/>`, `<rect x='153' y='152' width='14' height='20' rx='6' ${deep}/>`];
  if (m.includes('abs') || m.includes('core') || m.includes('oblique')) return [`<rect x='146' y='142' width='28' height='52' rx='11' ${red}/>`, `<rect x='149' y='148' width='10' height='38' rx='5' ${deep}/>`, `<rect x='161' y='148' width='10' height='38' rx='5' ${deep}/>`];
  if (m.includes('quad')) return [`<ellipse cx='145' cy='218' rx='15' ry='30' ${red}/>`, `<ellipse cx='175' cy='218' rx='15' ry='30' ${red}/>`, `<ellipse cx='145' cy='233' rx='10' ry='13' ${deep}/>`, `<ellipse cx='175' cy='233' rx='10' ry='13' ${deep}/>`];
  if (m.includes('hamstring')) return [`<ellipse cx='145' cy='223' rx='12' ry='27' ${red}/>`, `<ellipse cx='175' cy='223' rx='12' ry='27' ${red}/>`, `<ellipse cx='145' cy='238' rx='8' ry='10' ${deep}/>`, `<ellipse cx='175' cy='238' rx='8' ry='10' ${deep}/>`];
  if (m.includes('glute')) return [`<ellipse cx='147' cy='190' rx='14' ry='13' ${red}/>`, `<ellipse cx='173' cy='190' rx='14' ry='13' ${red}/>`, `<ellipse cx='147' cy='190' rx='8' ry='7' ${deep}/>`, `<ellipse cx='173' cy='190' rx='8' ry='7' ${deep}/>`];
  if (m.includes('calf')) return [`<ellipse cx='145' cy='267' rx='10' ry='19' ${red}/>`, `<ellipse cx='175' cy='267' rx='10' ry='19' ${red}/>`, `<ellipse cx='145' cy='276' rx='7' ry='8' ${deep}/>`, `<ellipse cx='175' cy='276' rx='7' ry='8' ${deep}/>`];
  return [`<ellipse cx='160' cy='162' rx='18' ry='26' ${red}/>`, `<ellipse cx='160' cy='162' rx='10' ry='16' ${deep}/>`];
};

const muscularBody = (view = 'front') => {
  const torsoShade = view === 'back' ? '#ebebeb' : '#f3f3f3';
  const contour = view === 'back' ? '#d7d7d7' : '#dcdcdc';
  return `
    <defs>
      <linearGradient id='skinGrad' x1='0' x2='0' y1='0' y2='1'>
        <stop offset='0%' stop-color='#fbfbfb'/>
        <stop offset='60%' stop-color='${torsoShade}'/>
        <stop offset='100%' stop-color='#dfdfdf'/>
      </linearGradient>
      <linearGradient id='shadeGrad' x1='0' x2='1' y1='0' y2='0'>
        <stop offset='0%' stop-color='#000' stop-opacity='0.12'/>
        <stop offset='100%' stop-color='#000' stop-opacity='0'/>
      </linearGradient>
    </defs>
    <circle cx='160' cy='60' r='23' fill='url(#skinGrad)'/>
    <path d='M112 116 Q126 90 147 90 L173 90 Q194 90 208 116 L204 176 Q188 198 160 198 Q132 198 116 176 Z' fill='url(#skinGrad)'/>
    <path d='M104 116 Q116 96 136 102 L131 154 Q126 179 110 184 Q98 174 96 156 Z' fill='url(#skinGrad)'/>
    <path d='M216 116 Q204 96 184 102 L189 154 Q194 179 210 184 Q222 174 224 156 Z' fill='url(#skinGrad)'/>
    <path d='M140 198 Q151 188 160 188 Q169 188 180 198 L173 292 Q160 304 147 292 Z' fill='url(#skinGrad)'/>
    <path d='M180 198 Q189 188 199 190 L193 292 Q182 304 170 292 Z' fill='url(#skinGrad)'/>
    <path d='M120 198 Q131 188 141 190 L150 292 Q138 304 127 292 Z' fill='url(#skinGrad)'/>
    <path d='M112 118 Q125 110 138 112' stroke='${contour}' stroke-width='2' fill='none'/>
    <path d='M208 118 Q195 110 182 112' stroke='${contour}' stroke-width='2' fill='none'/>
    <path d='M122 92 Q160 114 198 92' stroke='${contour}' stroke-width='1.7' fill='none' opacity='0.65'/>
    <path d='M128 150 Q160 138 192 150' stroke='${contour}' stroke-width='1.5' fill='none' opacity='0.55'/>
    <rect x='96' y='90' width='128' height='212' fill='url(#shadeGrad)' opacity='0.28'/>
    ${view === 'back' ? "<rect x='157' y='98' width='6' height='78' rx='3' fill='#d1d1d1' opacity='0.9'/>" : "<path d='M160 102 L160 186' stroke='#d8d8d8' stroke-width='2' opacity='0.85'/>"}
  `;
};

export const createExerciseSvgDataUrl = (name = 'Workout', muscle = 'General', equipment = 'Gym', options = {}) => {
  const secondaryMuscles = Array.isArray(options.secondaryMuscles) ? options.secondaryMuscles : [];
  const view = getView(muscle, options.view || 'auto');
  const title = shortText(name, 24);
  const subtitle = shortText(`${muscle} • ${equipment}`, 30);
  const primaryShape = activationShapes(muscle, view, 1).join('');
  const secondaryShape = secondaryMuscles
    .slice(0, 2)
    .map((sm) => activationShapes(sm, view, 0.45).join('').replaceAll('#ff4141', '#ff7a7a').replaceAll('#d41111', '#e54b4b'))
    .join('');

  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'>
    <rect width='320' height='320' rx='20' fill='#101419'/>
    <rect x='12' y='12' width='296' height='296' rx='16' fill='none' stroke='#2a3138'/>
    <g>${muscularBody(view)}${secondaryShape}${primaryShape}</g>
    <rect x='20' y='236' width='280' height='66' rx='10' fill='#0c0f13' stroke='#25303a'/>
    <text x='30' y='258' font-family='Arial' font-size='18' font-weight='700' fill='#ffffff'>${title}</text>
    <text x='30' y='279' font-family='Arial' font-size='14' fill='#b7c0cc'>${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const createFormDemoSvgDataUrl = (name = 'Workout', muscle = 'General', options = {}) => {
  const { animate = false, phase = 0 } = options;
  const view = getView(muscle, options.view || 'auto');
  const secondaryMuscles = Array.isArray(options.secondaryMuscles) ? options.secondaryMuscles : [];
  const leftPulse = animate ? (phase % 2 === 0 ? 1 : 0.35) : 0.8;
  const rightPulse = animate ? (phase % 2 === 0 ? 0.35 : 1) : 0.55;
  const leftPrimary = activationShapes(muscle, view, leftPulse).join('');
  const rightPrimary = activationShapes(muscle, view, rightPulse).join('');
  const leftSecondary = secondaryMuscles
    .slice(0, 2)
    .map((sm) => activationShapes(sm, view, 0.45).join('').replaceAll('#ff4141', '#ff8686').replaceAll('#d41111', '#eb6161'))
    .join('');
  const rightSecondary = secondaryMuscles
    .slice(0, 2)
    .map((sm) => activationShapes(sm, view, 0.35).join('').replaceAll('#ff4141', '#ff8f8f').replaceAll('#d41111', '#ec6c6c'))
    .join('');
  const rightShift = animate ? (phase % 2 === 0 ? 392 : 403) : 392;
  const leftShiftY = animate ? (phase % 2 === 0 ? 10 : 14) : 10;
  const rightShiftY = animate ? (phase % 2 === 0 ? 12 : 8) : 10;
  const arrowOpacity = animate ? (phase % 2 === 0 ? 1 : 0.55) : 0.8;
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='720' height='340' viewBox='0 0 720 340'>
    <rect width='720' height='340' rx='16' fill='#101419'/>
    <rect x='18' y='18' width='684' height='304' rx='12' fill='none' stroke='#2a3138'/>
    <g transform='translate(65,${leftShiftY})'>
      ${muscularBody(view)}
      ${leftSecondary}
      ${leftPrimary}
    </g>
    <g transform='translate(${rightShift},${rightShiftY})'>
      ${muscularBody(view)}
      ${rightSecondary}
      ${rightPrimary}
    </g>
    <text x='312' y='162' text-anchor='middle' font-size='38' fill='#f5c444' opacity='${arrowOpacity}' font-family='Arial'>→</text>
    <text x='70' y='304' font-size='14' fill='#b7c0cc' font-family='Arial'>Setup</text>
    <text x='398' y='304' font-size='14' fill='#b7c0cc' font-family='Arial'>Finish</text>
    <text x='28' y='34' font-size='15' fill='#ffffff' font-family='Arial' font-weight='700'>${shortText(name, 34)} • Form Demo</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const resolveExerciseImage = (exercise, hasLoadError = false, options = {}) => {
  const name = exercise?.name || 'Workout';
  const muscle = exercise?.muscleGroup?.primary || 'General';
  const equipment = exercise?.equipmentRequired || 'Gym';
  const secondaryMuscles = exercise?.muscleGroup?.secondary || [];
  if (!hasLoadError) return get3DAssetPath(muscle);
  return createExerciseSvgDataUrl(name, muscle, equipment, { ...options, secondaryMuscles });
};

