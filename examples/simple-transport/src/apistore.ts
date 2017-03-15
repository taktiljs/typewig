import { api, host } from 'taktil';


export class ApiStore {
    transport: api.Transport;

    init() {
        this.transport = host.createTransport();
    }
}

const apiStore = new ApiStore();


export default apiStore;