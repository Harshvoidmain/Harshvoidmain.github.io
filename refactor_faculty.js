const fs = require('fs');
let content = fs.readFileSync('app/components/faculty/FacultyModules.tsx', 'utf8');

if (!content.includes('BioluminescentGrid')) {
    content = content.replace('import { Button } from "@/components/ui/button";',
        'import { Button } from "@/components/ui/button";\\nimport { BioluminescentGrid, BioluminescentGridItem } from "@/components/ui/bioluminescent-grid";');
}

if (!content.includes('const getCardSpan')) {
    content = content.replace('const handleDownloadReport = async () => {',
        `const getCardSpan = (count?: number) => {
    const c = count || 0;
    if (c >= 20) return "md:col-span-2 lg:col-span-2 lg:row-span-2";
    if (c >= 10) return "md:col-span-2 lg:col-span-1";
    if (c >= 5) return "md:col-span-1 lg:col-span-1";
    return "col-span-1";
  };

  const handleDownloadReport = async () => {`);
}

content = content.replace('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">', '<BioluminescentGrid>');
content = content.replace('      {/* Information Management System Footer */}', '      </BioluminescentGrid>\\n\\n      {/* Information Management System Footer */}');

let lines = content.split('\\n');
let currentModuleVar = null;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* Publications Module */}')) currentModuleVar = 'facultyInfo.publications';
    else if (lines[i].includes('{/* Research Projects */}')) currentModuleVar = 'facultyInfo.research_projects';
    else if (lines[i].includes('{/* Contributions */}')) currentModuleVar = 'facultyInfo.total_contributions';
    else if (lines[i].includes('{/* Workshops & Conferences */}')) currentModuleVar = 'facultyInfo.workshops_attended';
    else if (lines[i].includes('{/* Faculty Interactions */}')) currentModuleVar = 'facultyInfo.interactions';
    else if (lines[i].includes('{/* FDP/STTP & Panels */}')) currentModuleVar = 'facultyInfo.trainings';
    else if (lines[i].includes('{/* Financial Support */}')) currentModuleVar = 'facultyInfo.financial_supports';
    else if (lines[i].includes('{/* Patents & Copyrights */}')) currentModuleVar = 'facultyInfo.patents';
    else if (lines[i].includes('{/* Professional Memberships */}')) currentModuleVar = 'facultyInfo.professional_memberships';
    else if (lines[i].includes('{/* Awards & Recognitions */}')) currentModuleVar = 'facultyInfo.awards';

    if (currentModuleVar && lines[i].includes('flex flex-col relative group overflow-hidden hover:-translate-y-1')) {
        lines[i] = \`        <BioluminescentGridItem className={\\\`flex flex-col group transition-all duration-300 hover:-translate-y-1 \${getCardSpan(\${currentModuleVar})}\\\`}>\`;
    if (lines[i+1].includes('{glossyEdge}')) {
       lines[i+1] = ''; // remove glossy edge as it's built into bioluminescent grid
    }
  }
}
content = lines.join('\\n');

content = content.replace(/<\\/div>\\n\\n        {\\/\\*/g, '</BioluminescentGridItem>\\n\\n        {/*');
content = content.replace(/<\\/div>\\n      <\\/div>\\n\\n      {\\/\\* Information/g, '</BioluminescentGridItem>\\n      </BioluminescentGrid>\\n\\n      {/* Information');

fs.writeFileSync('app/components/faculty/FacultyModules.tsx', content);
console.log('Done refactoring FacultyModules.tsx');
