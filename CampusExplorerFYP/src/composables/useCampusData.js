import { useCampusLocs } from "@/stores/campusLocs";
import { useCampusAreasStore } from "@/stores/campusAreas";

export async function ensureCampusDataLoaded() {
    console.log("[ensureCampusDataLoaded] called");
    const campusLocsStore = useCampusLocs();
    const campusAreasStore = useCampusAreasStore();

    if (!campusLocsStore.loaded && !campusLocsStore.loading) {
        console.log("[ensureCampusDataLoaded] starting to load campus locations");
        await campusLocsStore.startListeningLocations();
    } else {
        console.log("[ensureCampusDataLoaded] campus locations are already loaded");
        while (!campusLocsStore.loaded) {
        await new Promise((r) => setTimeout(r, 50));
        }
    }

    if (!campusAreasStore.loaded && !campusAreasStore.loading) {
        console.log("[ensureCampusDataLoaded] starting to load campus areas");
        await campusAreasStore.startListeningAreas();
    } else {
        console.log("[ensureCampusDataLoaded] campus areas are already loaded");
        while (!campusAreasStore.loaded) {
            await new Promise((r) => setTimeout(r, 50));
        }
    }
}