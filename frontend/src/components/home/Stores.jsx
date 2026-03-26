import { useEffect, useState } from "react";
import api from "../../api/api";

function Stores() {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get("/stores");
        setStores(res.data);
      } catch (err) {
        console.error("Error fetching stores", err);
      }
    };

    fetchStores();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <p className="text-sm text-brand mb-2">POPULAR STORES</p>

      <h2 className="text-3xl font-bold mb-10">Stores near you</h2>

      <div className="grid grid-cols-3 gap-8 mt-8">
        {stores.map((store) => (
          <div
            key={store._id}
            className="bg-card rounded-xl p-6 hover:scale-[1.03] transition-all duration-300 cursor-pointer border border-white/5"
          >
            {/* Store Logo */}
            <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold mb-4">
              {store.name.charAt(0)}
            </div>
            <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs px-2 py-1 rounded-md">
  20% OFF
</div>
            {/* Store Name */}
            <h3 className="text-lg font-semibold mb-1">{store.name}</h3>

            {/* Category */}
            <p className="text-sm text-textMuted mb-4">{store.category}</p>

            {/* Info Row */}
            <div className="flex items-center gap-3 text-sm">
              <span className="bg-bgSoft px-2 py-1 rounded-md">
                ⭐ {store.rating || 4.5}
              </span>

              <span className="bg-bgSoft px-2 py-1 rounded-md">⏱ 15 min</span>

              <span
                className={`px-2 py-1 rounded-md ${
                  store.isOpen
                    ? "bg-green-600/20 text-green-400"
                    : "bg-red-600/20 text-red-400"
                }`}
              >
                {store.isOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stores;
