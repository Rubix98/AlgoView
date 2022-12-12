import { Request, Response } from "express";
import { validate } from "../services/dbservice";
import { sendRequestsToCompilerAPI } from "../services/compilerservice";
import { CompilerMultiTestsRequest } from "../models/CompilerMultiTestsRequest";

export const compileCode = async (req: Request, res: Response) => {
    const [isOk, data] = await validate(req.body, CompilerMultiTestsRequest, "CompilerMultiTestsRequest");

    if (!isOk) {
        res.status(400).json({ error: "Invalid request body: " + data });
        return;
    }
    try {
        let response = await sendRequestsToCompilerAPI(data);
        let numberOfErrors = response.filter((response) => !response.success).length;
        if (numberOfErrors === 0) {
            res.status(200).json(response);
        } else if (numberOfErrors < response.length) {
            res.status(206).json(response);
        } else {
            res.status(400).json({ error: response[0].errorMessage });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
};
