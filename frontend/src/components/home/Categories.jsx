import { ShoppingBasket, Utensils, Cookie, Coffee, Pill } from "lucide-react"

const categories = [
  {
    name: "Groceries",
    items: "2.4k items",
    icon: ShoppingBasket,
  },
  {
    name: "Food",
    items: "850+ dishes",
    icon: Utensils,
  },
  {
    name: "Snacks",
    items: "1.1k snacks",
    icon: Cookie,
  },
  {
    name: "Beverages",
    items: "320+ drinks",
    icon: Coffee,
  },
  {
    name: "Medicines",
    items: "600+ items",
    icon: Pill,
  },
]

function Categories() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">

      <p className="text-sm text-brand mb-2">
        BROWSE CATEGORIES
      </p>

      <h2 className="text-3xl font-bold mb-10">
        What are you craving?
      </h2>

      <div className="grid grid-cols-5 gap-6">

        {categories.map((category, index) => {
          const Icon = category.icon

          return (
            <div
              key={index}
              className="bg-card p-8 rounded-xl flex flex-col items-center gap-4 hover:scale-105 hover:bg-slate-700 transition cursor-pointer"
            >

              <div className="bg-bgSoft p-4 rounded-full">
                <Icon size={30} className="text-brand" />
              </div>

              <h3 className="font-semibold">
                {category.name}
              </h3>

              <p className="text-sm text-textMuted">
                {category.items}
              </p>

            </div>
          )
        })}

      </div>

    </section>
  )
}

export default Categories