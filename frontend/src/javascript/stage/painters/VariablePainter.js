import Konva from "konva";
import { Painter } from "../Painter";

export class VariablePainter extends Painter {
    layerPosition = "topLeft";

    style = {
        fontSize: 30,
    };

    drawModel(variable) {
        let variableNumber = this.getLayer().find(".variable").length;

        const variableText = new Konva.Text({
            name: "variable",
            text: this.getLabel() + ": " + variable,
            fontSize: this.style.fontSize,
            fill: this.color,
            y: variableNumber * this.style.fontSize,
        });
        this.mainGroup.add(variableText);
    }

    getLabel() {
        return this.sceneObject.variables.map((variable) => variable.name).join(", ");
    }
}
