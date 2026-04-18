import fs from 'fs';
const appPath = 'src/App.tsx';
let source = fs.readFileSync(appPath, 'utf8');

const effects = `  useEffect(() => {
    localStorage.setItem("statsPeriod", statsPeriod.toString());
  }, [statsPeriod]);

  useEffect(() => {
    localStorage.setItem("activeChartType", activeChartType);
  }, [activeChartType]);

  useEffect(() => {
    localStorage.setItem("statisticsSubTab", statisticsSubTab);
  }, [statisticsSubTab]);

  useEffect(() => {
    localStorage.setItem("statsStatus", statsStatus);
  }, [statsStatus]);

`;

source = source.replace(effects, '');

const insertionTarget = `  const [isShareScreenOpen, setIsShareScreenOpen] = useState(false);`;
source = source.replace(insertionTarget, insertionTarget + '\n' + effects);

fs.writeFileSync(appPath, source, 'utf8');
