import AppNavigation from "./src/navigation/AppNavigation";
import { FavoritesProvider } from "./src/hooks/useFavorites";

export default function App() {
    return (
        <FavoritesProvider>
            <AppNavigation />
        </FavoritesProvider>
    );
}
