import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Link href="/masterlist">
        <button className="btn-form outline">masterlist</button>
      </Link>
    </div>
  );
}
