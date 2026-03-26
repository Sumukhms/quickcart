function Hero() {
  return (
    <section className="bg-gradient-to-r from-indigo-700 to-indigo-900 py-24">

      <div className="max-w-7xl mx-auto px-6 text-white">

        <p className="text-sm text-indigo-300 mb-3">
          ⚡ Lightning Fast
        </p>

        <h1 className="text-5xl font-bold mb-6">
          Delivered in <span className="text-brandLight">10 Minutes</span>
        </h1>

        <p className="text-lg text-gray-300 mb-8">
          Fresh groceries, hot food & daily essentials delivered instantly.
        </p>

        <div className="flex gap-4">

          <button className="bg-brand px-6 py-3 rounded-lg hover:bg-brandLight transition">
            Order Now →
          </button>

          <button className="border border-white/20 px-6 py-3 rounded-lg">
            Explore Stores
          </button>

        </div>

      </div>

    </section>
  )
}

export default Hero