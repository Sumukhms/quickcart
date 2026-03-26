function OfferBanner() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">

      <div className="bg-card rounded-2xl p-10 flex flex-col md:flex-row justify-between items-center">

        <div>

          <p className="text-sm text-brand mb-2">
            ⚡ Limited Time
          </p>

          <h2 className="text-3xl font-bold mb-3">
            First order? Get ₹100 OFF
          </h2>

          <p className="text-textMuted">
            Use code <span className="text-brand font-semibold">QUICKFIRST</span> at checkout.
            Valid on orders above ₹299.
          </p>

        </div>

        <button className="mt-6 md:mt-0 bg-brand px-6 py-3 rounded-lg hover:bg-brandLight transition">
          Claim Offer →
        </button>

      </div>

    </section>
  )
}

export default OfferBanner