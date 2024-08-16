import axios from "axios";
import { ENDPOINTS } from "src/shared/endpoints";

export const saveDocument = async (documentData: any) => {
    //  TODO: Replace this with your actual API endpoint
    const response = await axios.post(`${ENDPOINTS.api.BaseUrl}/saveDocument`, documentData);
    return response.data; // Handle the response accordingly
};