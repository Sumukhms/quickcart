import logo from "../assets/logo/qc-logo1.png";
import { ShoppingCart, Package, User, Search } from "lucide-react";

function Navbar() {
  return (
    <nav className="bg-bgSoft border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="QuickCart Logo"
            className="h-10 object-contain"
          />
        </div>

        {/* Search */}
        <div className="w-[600px] relative">
          <Search
            className="absolute left-3 top-2.5 text-textMuted"
            size={18}
          />

          <input
            type="text"
            placeholder="Search products or stores..."
            className="w-full bg-card text-textPrimary placeholder:text-textMuted pl-10 pr-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-brand"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 text-textPrimary">
          <button className="flex items-center gap-2 hover:text-brand transition transform hover:scale-105">
            <div className="relative">
              <ShoppingCart size={22} />

              <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                2
              </span>
            </div>
            Cart
          </button>

          <button className="flex items-center gap-2 hover:text-brand transition transform hover:scale-105">
            <Package size={20} />
            Orders
          </button>

          <button className="flex items-center gap-2 bg-brand px-4 py-2 rounded-lg hover:bg-brandLight transition transform hover:scale-105">
            <User size={18} />
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
