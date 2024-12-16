import axios from "axios";

import  ENDPOINTS from "src/shared/endpoints.json";

export const saveDocument = async (documentData: string) => {
    const response = await axios.post(`${ENDPOINTS.api.BaseUrl}/saveDocument`, documentData);
    return response.data; // Handle the response accordingly
};