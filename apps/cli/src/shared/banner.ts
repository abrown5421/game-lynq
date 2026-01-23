import figlet from 'figlet';

export function showBanner() {
  console.clear();

  const banner = figlet.textSync('MERN CLI', {
    font: 'Big',
  });

  console.log(banner);
  console.log('Welcome to the CLI\n');
}
