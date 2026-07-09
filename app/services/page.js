import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  return (
    <section className="section">
      <div className="container is-fluid">
        <div className="level mb-5">
          <div className="level-left">
            <h1 className="title is-2">Services</h1>
          </div>
          <div className="level-right">
            <Link className="button is-light" href="/">
              Back Home
            </Link>
          </div>
        </div>

        <p className="subtitle is-5">
          Bella Vista Dedicated Logistics LLC is a Salem, MA-based, family-owned 3PL provider serving Massachusetts, Rhode Island, New Hampshire, and Maine.
        </p>

        <div className="columns is-multiline">
          <div className="column is-6">
            <div className="box">
              <h2 className="title is-4">LTL and Cartage</h2>
              <p>
                Regional less-than-truckload and local cartage service for daily distribution, replenishment, and time-sensitive customer deliveries.
              </p>
            </div>
          </div>

          <div className="column is-6">
            <div className="box">
              <h2 className="title is-4">Pool Distribution</h2>
              <p>
                Consolidated freight handling for multi-location delivery programs, including route density planning and direct-to-store patterns.
              </p>
            </div>
          </div>

          <div className="column is-6">
            <div className="box">
              <h2 className="title is-4">Line Haul Transportation</h2>
              <p>
                Dedicated and scheduled line haul options between fulfillment points, terminals, and customer destinations throughout New England.
              </p>
            </div>
          </div>

          <div className="column is-6">
            <div className="box">
              <h2 className="title is-4">Warehousing and Fulfillment Support</h2>
              <p>
                Storage overflow, cross-dock handling, transfer support, and local fulfillment coordination integrated with outbound transportation.
              </p>
            </div>
          </div>
        </div>

        <div className="box">
          <h2 className="title is-4">Service Area</h2>
          <div className="tags are-medium">
            <span className="tag is-dark">Massachusetts</span>
            <span className="tag is-dark">Rhode Island</span>
            <span className="tag is-dark">New Hampshire</span>
            <span className="tag is-dark">Maine</span>
          </div>
        </div>

        <div className="box">
          <h2 className="title is-4">Need Coverage Now?</h2>
          <p className="mb-4">
            Contact our operations team to scope lanes, schedule windows, and dedicated team requirements.
          </p>
          <div className="buttons">
            <Link className="button is-primary" href="/login">
              Admin Login
            </Link>
            <Link className="button is-link" href="/onboarding">
              Onboarding Portal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
