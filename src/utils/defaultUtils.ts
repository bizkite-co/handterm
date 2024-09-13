import axios from "axios";
import { ENDPOINTS } from "src/shared/endpoints";

export const saveDocument = async (documentData: any) => {
    const response = await axios.post(`${ENDPOINTS.api.BaseUrl}/saveDocument`, documentData);
    return response.data; // Handle the response accordingly
};