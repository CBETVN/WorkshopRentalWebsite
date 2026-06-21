import Link from "next/link";
import Panel from "@/components/Panel/Panel"; // reusable boxed container
import styles from "./page.module.css"; // scoped plain-CSS styles for this page

export default function Home() {
  return (
    <main className={styles.main}>

      {/* Header */}
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sofia, Bulgaria</p>
        <h1 className={styles.title}>Workshop<br />Rental</h1>
        <p className={styles.subtitle}>Professional workspace. Book by the hour.</p>
      </header>

      {/* Room Card */}
      <section className={styles.room}>
        {/* flush = no padding, so the photo can fill the panel edge-to-edge */}
        <Panel flush>

          {/* Photo placeholder */}
          <div className={styles.photo}>
            <span className={styles.photoLabel}>Photo coming soon</span>
          </div>

          {/* Content */}
          <div className={styles.panelBody}>

            {/* Title + badge */}
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.roomName}>Workshop Room A</h2>
                <p className={styles.roomDesc}>Fully equipped — tools, benches, good lighting</p>
              </div>
              <span className={styles.badge}>Available</span>
            </div>

            {/* Details */}
            <div className={styles.details}>
              <div>
                <p className={styles.detailLabel}>Location</p>
                <p className={styles.detailValue}>Sofia, BG</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Capacity</p>
                <p className={styles.detailValue}>Up to 4 people</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Booking</p>
                <p className={styles.detailValue}>By the hour</p>
              </div>
            </div>

            {/* Price + CTA */}
            <div className={styles.priceRow}>
              <div>
                <span className={styles.price}>€10</span>
                <span className={styles.priceUnit}>/ hour</span>
              </div>
              <Link href="/booking">
                <button className={styles.bookButton}>
                  Book Now →
                </button>
              </Link>
            </div>

          </div>
        </Panel>

        {/* Footer note */}
        <p className={styles.footnote}>Payment by card only · Upfront booking · Instant confirmation</p>
      </section>

    </main>
  );
}
