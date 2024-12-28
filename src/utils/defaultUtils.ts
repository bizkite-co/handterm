import axios from 'axios';
import { type AxiosResponse } from 'axios';
import ENDPOINTS from '../shared/endpoints.json';

interface Endpoints {
  api: {
    BaseUrl: string;
  };
}

const typedEndpoints = ENDPOINTS as Endpoints;

interface DocumentResponse {
  success: boolean;
  message: string;
}

export const saveDocument = async (documentData: string): Promise<DocumentResponse> => {
  const response: AxiosResponse<DocumentResponse> = await axios.post(
    `${typedEndpoints.api.BaseUrl}/saveDocument`,
    documentData
  );
  return response.data;
};
