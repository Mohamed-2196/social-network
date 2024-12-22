
import HomePage from "./components/home";

export default function Home() {
 

  // Render home page if authenticated
  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <HomePage />
    </div>
  );
}