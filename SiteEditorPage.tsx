import React, { useEffect, useState } from 'react';
import { Upload } from 'antd';
import { getPublicUrl } from '../services/imageService';

const SiteEditorPage = () => {
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleUpload = async (file) => {
        setLoading(true);
        setError(null);

        // Validating file extension
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
        const isValidFile = validExtensions.some(ext => file.name.endsWith(ext));
        if (!isValidFile) {
            setError('Invalid file type! Please upload an image.');
            setLoading(false);
            return;
        }

        try {
            const url = await getPublicUrl(file);
            setImageUrl(url);
            // Add auto-save logic after upload here
            // autoSaveImage(url);
        } catch (err) {
            setError('Error uploading file.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load existing image if any
        const loadExistingImage = async () => {
            setLoading(true);
            try {
                const existingImageUrl = await getPublicUrl('existing-image'); // Replace with actual logic to get existing image 
                setImageUrl(existingImageUrl);
            } catch (err) {
                setError('Error loading existing image.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadExistingImage();
    }, []);

    return (
        <div>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {imageUrl && <img src={imageUrl} alt="Uploaded" />}
            <Upload beforeUpload={handleUpload} showUploadList={false}>
                <button type="button">Upload Image</button>
            </Upload>
        </div>
    );
};

export default SiteEditorPage;
