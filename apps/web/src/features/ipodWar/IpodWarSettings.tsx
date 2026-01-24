type Props = {
  session: any;
};

const IpodWarSettings = ({ session }: Props) => {
  return (
    <div className="max-w-xl mx-auto bg-accent p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-primary mb-4">Ipod War Settings</h2>

      <label className="block mb-2">Clip Length (seconds)</label>
      <input className="input-primary w-full mb-4" type="number" />

      <label className="block mb-2">Rounds</label>
      <input className="input-primary w-full mb-4" type="number" />

      <button className="btn-primary w-full mt-4">
        Save Settings
      </button>
    </div>
  );
};

export default IpodWarSettings;
