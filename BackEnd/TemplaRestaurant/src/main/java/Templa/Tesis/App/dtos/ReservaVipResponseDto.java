package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReservaVipResponseDto {
    private Integer reservaId;
    private String preferenceId;
    private String initPoint;
    private String sandboxInitPoint;
    private Boolean requierePago;
    private Double monto;
}
