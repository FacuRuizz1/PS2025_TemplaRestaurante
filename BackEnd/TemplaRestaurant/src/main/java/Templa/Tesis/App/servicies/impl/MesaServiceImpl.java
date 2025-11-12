package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.EstadoMesa;
import Templa.Tesis.App.Enums.TipoPlato;
import Templa.Tesis.App.dtos.GetMesaDto;
import Templa.Tesis.App.dtos.PostMesaDto;
import Templa.Tesis.App.dtos.UpdateMesaPosicionDto;
import Templa.Tesis.App.entities.MesaEntity;
import Templa.Tesis.App.repositories.MesaRepository;
import Templa.Tesis.App.servicies.IMesasService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MesaServiceImpl implements IMesasService {
    @Autowired
    private MesaRepository mesaRepository;
    @Autowired
    private ModelMapper modelMapper;

    @Override
    public GetMesaDto createMesa(PostMesaDto postMesaDto) {
        Optional<MesaEntity> existe = mesaRepository.findByNumeroMesa(postMesaDto.getNumeroMesa());
        if (existe.isPresent()) {
            throw new RuntimeException("La mesa con el numero " + postMesaDto.getNumeroMesa() + " ya existe");
        }

        try{
            MesaEntity mesa = modelMapper.map(postMesaDto, MesaEntity.class);

            return modelMapper.map(mesaRepository.save(mesa), GetMesaDto.class);
        } catch (Exception e){
            throw new RuntimeException("Error al crear la mesa: " + e.getMessage());
        }
    }

    @Override
    public GetMesaDto updateMesa(GetMesaDto mesaDto) {
        Optional<MesaEntity> existe = mesaRepository.findById(mesaDto.getIdMesa());

        if (existe.isEmpty()) {
            throw new RuntimeException("La mesa con el id " + mesaDto.getIdMesa() + " no existe");
        }

        try{
            MesaEntity mesaEntity = modelMapper.map(mesaDto, MesaEntity.class);
            MesaEntity mesaActualizada = mesaRepository.save(mesaEntity);
            return modelMapper.map(mesaActualizada, GetMesaDto.class);
        } catch (Exception e){
            throw new RuntimeException("Error al actualizar la mesa: " + e.getMessage());
        }
    }

    @Override
    public Page<GetMesaDto> getMesas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("idMesa"));
        Page<MesaEntity> mesas = mesaRepository.findAll(pageable);
        return mesas.map(mesa -> modelMapper.map(mesa, GetMesaDto.class));
    }

    @Override
    public Page<GetMesaDto> getMesas(String buscarFiltro, String estadoMesa, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("idMesa"));

        Specification<MesaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (buscarFiltro != null && !buscarFiltro.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("numeroMesa").as(String.class)), "%" + buscarFiltro.toLowerCase() + "%"));
            }
            if (estadoMesa != null && !estadoMesa.isEmpty()) {
                predicates.add(cb.equal(root.get("estadoMesa"), EstadoMesa.valueOf(estadoMesa)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<MesaEntity> mesas = mesaRepository.findAll(spec, pageable);
        return mesas.map(mesa -> modelMapper.map(mesa, GetMesaDto.class));
    }

    @Override
    @Transactional
    public GetMesaDto cambiarEstadoMesa(Integer id, EstadoMesa nuevoEstado) {
        Optional<MesaEntity> existe = mesaRepository.findById(id);
        if (existe.isEmpty()) {
            throw new RuntimeException("La mesa con el id " + id + " no existe");
        }
        if(nuevoEstado == null) {
            throw new RuntimeException("El estado de la mesa no puede ser nulo");
        }
        MesaEntity mesa = existe.get();
        mesa.setEstadoMesa(nuevoEstado);
        return modelMapper.map(mesaRepository.save(mesa), GetMesaDto.class);
    }

    @Override
    public GetMesaDto getMesaById(Integer id) {
        Optional<MesaEntity> existe = mesaRepository.findById(id);
        if (existe.isEmpty()) {
            throw new RuntimeException("La mesa con el id " + id + " no existe");
        }
        return modelMapper.map(existe.get(), GetMesaDto.class);
    }

    @Override
    public GetMesaDto actualizarPosicionMesa(UpdateMesaPosicionDto mesaPosicionDto) {
        MesaEntity mesa = mesaRepository.findById(mesaPosicionDto.getIdMesa())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Mesa no encontrada con ID: " + mesaPosicionDto.getIdMesa()));

        if (mesaPosicionDto.getPiso() < 0 || mesaPosicionDto.getPiso() > 2) {
            throw new IllegalArgumentException("El piso debe estar entre 0 y 2");
        }

        mesa.setPosX(mesaPosicionDto.getPosX());
        mesa.setPosY(mesaPosicionDto.getPosY());
        mesa.setPiso(mesaPosicionDto.getPiso());

        MesaEntity mesaActualizada = mesaRepository.save(mesa);
        return modelMapper.map(mesaActualizada, GetMesaDto.class);
    }

    @Override
    public List<GetMesaDto> getMesasConPosicion() {
        List<MesaEntity> mesas = mesaRepository.findAllConPosicion();
        return mesas.stream()
                .map(mesa -> modelMapper.map(mesa, GetMesaDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<GetMesaDto> obtenerMesasPorPiso(Integer piso) {
        if (piso < 0 || piso > 2) {
            throw new IllegalArgumentException("El piso debe estar entre 0 y 2");
        }

        List<MesaEntity> mesas = mesaRepository.findByPiso(piso);
        return mesas.stream()
                .map(mesa -> modelMapper.map(mesa, GetMesaDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public void desvincularMesaDelPlano(Integer idMesa) {
        MesaEntity mesa = mesaRepository.findById(idMesa)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Mesa no encontrada con ID: " + idMesa));

        // Setear coordenadas a null
        mesa.setPosX(null);
        mesa.setPosY(null);
        mesa.setPiso(null);

        mesaRepository.save(mesa);
    }

    @Override
    public boolean estaVinculada(Integer idMesa) {
        return mesaRepository.estaVinculada(idMesa);
    }
}
