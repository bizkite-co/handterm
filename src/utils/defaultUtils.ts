import axios from 'axios';
import { type AxiosResponse } from 'axios';
import ENDPOINTS from '../shared/endpoints.json';

interface Endpoints {
  api: {
    baseUrl: string;
  };
}

const typedEndpoints = ENDPOINTS as unknown as Endpoints;

interface DocumentResponse {
  success: boolean;
  message: string;
}

export const saveDocument = async (documentData: string): Promise<DocumentResponse> => {
  const response: AxiosResponse<DocumentResponse> = await axios.post(
    `${typedEndpoints.api.baseUrl}/saveDocument`,
    documentData
  );
  return response.data;
};
