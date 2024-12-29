class CrudService {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        try {
            const document = new this.model(data);
            return await document.save();
        } catch (error) {
            throw new Error(`Error creating document: ${error.message}`);
        }
    }

    async read(filter = {}, projection = null, options = {}) {
        try {
            return await this.model.find(filter, projection, options);
        } catch (error) {
            throw new Error(`Error reading documents: ${error.message}`);
        }
    }

    async readById(id, projection = null, options = {}) {
        try {
            return await this.model.findById(id, projection, options);
        } catch (error) {
            throw new Error(`Error reading document by ID: ${error.message}`);
        }
    }

    async update(id, data) {
        try {
            return await this.model.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            throw new Error(`Error updating document: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            return await this.model.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error deleting document: ${error.message}`);
        }
    }
}

export default CrudService;
