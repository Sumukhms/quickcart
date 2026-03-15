import { ShoppingBasket, Utensils, Cookie, Coffee, Pill } from "lucide-react";
import { useEffect, useState } from "react";
import { getStores } from "../api/api";

const categories = [
  { name: "Groceries", icon: ShoppingBasket },
  { name: "Food", icon: Utensils },
  { name: "Snacks", icon: Cookie },
  { name: "Beverages", icon: Coffee },
  { name: "Medicines", icon: Pill },
];

const [stores, setStores] = useState([]);

useEffect(() => {
  const fetchStores = async () => {
    try {
      const data = await getStores();
      setStores(data);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  fetchStores();
}, []);

function Home() {
  return (
    <div className="bg-bgMain min-h-screen text-textPrimary p-10">
      <h1 className="text-3xl font-bold mb-8">Shop by Category</h1>

      <div className="grid grid-cols-5 gap-6">
        {categories.map((category, index) => {
          const Icon = category.icon;

          return (
            <div
              key={index}
              className="bg-card p-8 rounded-2xl flex flex-col items-center gap-4 hover:scale-105 hover:bg-slate-700 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg"
            >
              <div className="bg-bgSoft p-3 rounded-full">
                <Icon size={28} className="text-brand" />
              </div>

              <span className="text-textPrimary font-medium">
                {category.name}
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-6">Nearby Stores</h2>

      <div className="grid grid-cols-3 gap-6">
        {stores.map((store) => (
          <div
            key={store._id}
            className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-textPrimary">
              {store.name}
            </h3>

            <p className="text-textMuted text-sm mt-2">{store.category}</p>

            <p className="text-textMuted text-sm mt-1">
              Rating: ⭐ {store.rating}
            </p>

            <p className="text-textMuted text-sm mt-1">
              {store.isOpen ? "Open Now" : "Closed"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
