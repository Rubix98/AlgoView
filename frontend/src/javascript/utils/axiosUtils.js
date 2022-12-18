import axios from "axios";
import toast, { getEndpointRelatedToast } from "@/javascript/utils/toastUtils";

export function sendRequest(url, data = {}, method) {
    if (!validateMethod(method)) return;

    if (!data) data = {};
    data.withCredentials = true;

    const toastStrings = getEndpointRelatedToast(url);
    const loadingToast = toastStrings.loading ? toast.info(toastStrings.loading, { timeout: false }) : undefined;

    method = method.toLowerCase();
    url = getBackendUrl() + url;
    console.log(method, url);
    return axios[method](url, data)
        .then((response) => {
            console.log(response);
            if (toastStrings.success) toast.success(toastStrings.success);
            return response.data;
        })
        .catch((error) => {
            console.error(error);
            let errorMessage = error.message + (error.response ? "\nDetails: " + error.response.data.error : "");
            console.error(errorMessage);
            toast.error(toastStrings.error ? toastStrings.error : "Wystąpił błąd! Spróbuj ponownie później.");
        })
        .finally(() => {
            if (loadingToast != undefined) toast.dismiss(loadingToast);
        });
}

function getBackendUrl() {
    return window.location.origin.includes("localhost") ? "http://localhost:8080" : "https://algodebug.herokuapp.com";
}

function validateMethod(method) {
    return method && ["get", "post", "put"].includes(method.toLowerCase());
}
